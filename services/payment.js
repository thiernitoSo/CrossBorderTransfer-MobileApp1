const { v4: uuidv4 } = require('uuid');
const { orangeMoneyService } = require('./orangeMoney');
const { rafikiService } = require('./rafiki');

/**
 * Unified Payment Service
 * 
 * This service provides a unified interface for making payments
 * and money transfers using different payment providers.
 */

/**
 * Unified Payment Service class
 */
class PaymentService {
  /**
   * Check if a payment provider is available for a specific country
   * @param provider The payment provider to check
   * @param countryCode The country code to check support for
   * @returns boolean
   */
  isProviderAvailableForCountry(provider, countryCode) {
    if (provider === 'orange_money') {
      const orangeCountries = orangeMoneyService.getSupportedCountries();
      return orangeCountries.includes(countryCode);
    } else if (provider === 'rafiki') {
      const rafikiCountries = rafikiService.getSupportedCountries();
      return rafikiCountries.includes(countryCode);
    }
    return false;
  }

  /**
   * Check if a payment method is available for a specific country
   * @param method The payment method to check
   * @param countryCode The country code to check support for
   * @returns boolean
   */
  isPaymentMethodAvailableForCountry(method, countryCode) {
    if (['orange_money', 'mobile_money'].includes(method)) {
      // Orange Money is primarily for mobile money in West Africa
      return this.isProviderAvailableForCountry('orange_money', countryCode);
    } else if (['rafiki', 'bank_transfer', 'cash_pickup'].includes(method)) {
      // Rafiki supports bank transfers and cash pickup in East/Southern Africa
      return this.isProviderAvailableForCountry('rafiki', countryCode);
    }
    return false;
  }

  /**
   * Get all available payment methods for a specific country
   * @param countryCode The country code to get payment methods for
   * @returns Array of available payment methods
   */
  getAvailablePaymentMethods(countryCode) {
    const methods = [];
    
    if (this.isProviderAvailableForCountry('orange_money', countryCode)) {
      methods.push('orange_money', 'mobile_money');
    }
    
    if (this.isProviderAvailableForCountry('rafiki', countryCode)) {
      methods.push('rafiki', 'bank_transfer', 'cash_pickup');
    }
    
    return methods;
  }

  /**
   * Get a price quote for a money transfer
   * @param data Quote request data
   * @returns Promise<QuoteResult>
   */
  async getQuote(data) {
    // Determine which provider to use based on country and payment method
    const provider = this.determineProvider(data.destinationCountry, data.paymentMethod);
    
    if (provider === 'rafiki') {
      const rafikiRequest = {
        sourceAmount: data.sourceAmount,
        destinationAmount: data.destinationAmount,
        sourceCurrency: data.sourceCurrency,
        destinationCurrency: data.destinationCurrency,
        destinationCountry: data.destinationCountry,
        paymentMethod: this.mapToRafikiPaymentMethod(data.paymentMethod)
      };
      
      const rafikiQuote = await rafikiService.getQuote(rafikiRequest);
      
      return {
        quoteId: rafikiQuote.quoteId,
        sourceAmount: rafikiQuote.sourceAmount,
        destinationAmount: rafikiQuote.destinationAmount,
        sourceCurrency: rafikiQuote.sourceCurrency,
        destinationCurrency: rafikiQuote.destinationCurrency,
        exchangeRate: rafikiQuote.exchangeRate,
        fee: rafikiQuote.fee,
        total: rafikiQuote.sourceAmount + rafikiQuote.fee,
        deliveryEstimate: rafikiQuote.deliveryEstimate,
        validUntil: rafikiQuote.validUntil,
        provider: 'rafiki'
      };
    } else {
      // For Orange Money, we calculate our own quote since they don't have a quote API
      const exchangeRate = this.getExchangeRate(data.sourceCurrency, data.destinationCurrency);
      const sourceAmount = data.sourceAmount || (data.destinationAmount ? data.destinationAmount / exchangeRate : 100);
      const destinationAmount = data.destinationAmount || (data.sourceAmount ? data.sourceAmount * exchangeRate : 0);
      const fee = sourceAmount * 0.03; // 3% fee for Orange Money
      
      return {
        quoteId: uuidv4(),
        sourceAmount: sourceAmount,
        destinationAmount: destinationAmount,
        sourceCurrency: data.sourceCurrency,
        destinationCurrency: data.destinationCurrency,
        exchangeRate: exchangeRate,
        fee: fee,
        total: sourceAmount + fee,
        deliveryEstimate: '10-30 minutes',
        validUntil: new Date(Date.now() + (5 * 60 * 1000)).toISOString(), // Valid for 5 minutes
        provider: 'orange_money'
      };
    }
  }

  /**
   * Initiate a payment or money transfer
   * @param data Payment request data
   * @returns Promise<PaymentResult>
   */
  async initiatePayment(data) {
    const reference = data.reference || uuidv4();
    
    if (data.provider === 'rafiki') {
      // Check if destination is provided for Rafiki
      if (!data.destination) {
        throw new Error('Destination details required for Rafiki transfers');
      }
      
      const rafikiRequest = {
        amount: data.sourceAmount,
        sourceCurrency: data.sourceCurrency,
        destinationCurrency: data.destinationCurrency,
        reference: reference,
        description: data.description || 'Money transfer via SendAfrika',
        destination: data.destination
      };
      
      const rafikiResponse = await rafikiService.initiateTransfer(rafikiRequest);
      
      return {
        id: rafikiResponse.id,
        status: this.mapStatus(rafikiResponse.status),
        sourceAmount: rafikiResponse.sourceAmount,
        sourceCurrency: rafikiResponse.sourceCurrency,
        destinationAmount: rafikiResponse.destinationAmount,
        destinationCurrency: rafikiResponse.destinationCurrency,
        exchangeRate: rafikiResponse.exchangeRate,
        fee: rafikiResponse.fee,
        reference: rafikiResponse.reference,
        provider: 'rafiki',
        paymentUrl: rafikiResponse.paymentUrl,
        message: rafikiResponse.message,
        createdAt: rafikiResponse.createdAt,
        updatedAt: rafikiResponse.updatedAt
      };
    } else {
      // Check if phone number is provided for Orange Money
      if (!data.phoneNumber) {
        throw new Error('Phone number required for Orange Money payments');
      }
      
      const orangeMoneyRequest = {
        amount: data.sourceAmount,
        currency: data.sourceCurrency,
        phoneNumber: data.phoneNumber,
        description: data.description || 'Mobile money transfer via SendAfrika',
        externalReference: reference
      };
      
      const orangeMoneyResponse = await orangeMoneyService.initiatePayment(orangeMoneyRequest);
      
      return {
        id: orangeMoneyResponse.id,
        status: this.mapStatus(orangeMoneyResponse.status),
        sourceAmount: data.sourceAmount,
        sourceCurrency: data.sourceCurrency,
        destinationAmount: data.destinationAmount,
        destinationCurrency: data.destinationCurrency,
        exchangeRate: this.getExchangeRate(data.sourceCurrency, data.destinationCurrency),
        fee: data.sourceAmount * 0.03, // 3% fee for Orange Money
        reference: orangeMoneyResponse.reference,
        provider: 'orange_money',
        paymentUrl: orangeMoneyResponse.paymentUrl,
        message: orangeMoneyResponse.message,
        createdAt: orangeMoneyResponse.createdAt,
        updatedAt: orangeMoneyResponse.updatedAt
      };
    }
  }

  /**
   * Check the status of a payment or money transfer
   * @param id The payment ID
   * @param provider The payment provider
   * @returns Promise<PaymentResult>
   */
  async checkPaymentStatus(id, provider) {
    if (provider === 'rafiki') {
      const rafikiResponse = await rafikiService.checkTransferStatus(id);
      
      return {
        id: rafikiResponse.id,
        status: this.mapStatus(rafikiResponse.status),
        sourceAmount: rafikiResponse.sourceAmount,
        sourceCurrency: rafikiResponse.sourceCurrency,
        destinationAmount: rafikiResponse.destinationAmount,
        destinationCurrency: rafikiResponse.destinationCurrency,
        exchangeRate: rafikiResponse.exchangeRate,
        fee: rafikiResponse.fee,
        reference: rafikiResponse.reference,
        provider: 'rafiki',
        message: rafikiResponse.message,
        createdAt: rafikiResponse.createdAt,
        updatedAt: rafikiResponse.updatedAt
      };
    } else {
      const orangeMoneyResponse = await orangeMoneyService.checkTransactionStatus(id);
      
      // We need to reconstruct some missing data from Orange Money
      const exchangeRate = this.getExchangeRate(orangeMoneyResponse.currency, '');
      const destinationAmount = orangeMoneyResponse.amount * exchangeRate;
      const fee = orangeMoneyResponse.amount * 0.03; // 3% fee
      
      return {
        id: orangeMoneyResponse.id,
        status: this.mapStatus(orangeMoneyResponse.status),
        sourceAmount: orangeMoneyResponse.amount,
        sourceCurrency: orangeMoneyResponse.currency,
        destinationAmount: destinationAmount,
        destinationCurrency: 'XOF', // Default for Orange Money
        exchangeRate: exchangeRate,
        fee: fee,
        reference: orangeMoneyResponse.reference,
        provider: 'orange_money',
        message: orangeMoneyResponse.message,
        createdAt: orangeMoneyResponse.createdAt,
        updatedAt: orangeMoneyResponse.updatedAt
      };
    }
  }

  /**
   * Cancel a payment or money transfer
   * @param id The payment ID
   * @param provider The payment provider
   * @returns Promise<boolean>
   */
  async cancelPayment(id, provider) {
    if (provider === 'rafiki') {
      return await rafikiService.cancelTransfer(id);
    } else {
      return await orangeMoneyService.cancelTransaction(id);
    }
  }

  /**
   * Determine which provider to use based on country and payment method
   * @param countryCode The destination country code
   * @param paymentMethod The requested payment method
   * @returns The appropriate payment provider
   */
  determineProvider(countryCode, paymentMethod) {
    // First check if the payment method directly maps to a provider
    if (paymentMethod === 'orange_money') {
      return 'orange_money';
    }
    
    if (paymentMethod === 'rafiki') {
      return 'rafiki';
    }
    
    // Otherwise check based on country and method
    if (['mobile_money'].includes(paymentMethod) && 
        this.isProviderAvailableForCountry('orange_money', countryCode)) {
      return 'orange_money';
    }
    
    if (['bank_transfer', 'cash_pickup'].includes(paymentMethod) && 
        this.isProviderAvailableForCountry('rafiki', countryCode)) {
      return 'rafiki';
    }
    
    // Default to the provider that supports the country
    if (this.isProviderAvailableForCountry('orange_money', countryCode)) {
      return 'orange_money';
    }
    
    if (this.isProviderAvailableForCountry('rafiki', countryCode)) {
      return 'rafiki';
    }
    
    throw new Error(`No payment provider available for ${countryCode} with method ${paymentMethod}`);
  }

  /**
   * Map our payment method to Rafiki payment method
   * @param method Our payment method
   * @returns Rafiki payment method
   */
  mapToRafikiPaymentMethod(method) {
    if (method === 'bank_transfer') {
      return 'bank_account';
    } else if (['mobile_money', 'orange_money'].includes(method)) {
      return 'mobile_wallet';
    } else if (method === 'cash_pickup') {
      return 'cash_pickup';
    } else {
      return 'mobile_wallet';
    }
  }

  /**
   * Map payment status from provider to our unified status
   * @param status Provider status
   * @returns Our unified status
   */
  mapStatus(status) {
    // The statuses are already aligned between our providers and unified format
    return status;
  }

  /**
   * Get exchange rate between currencies
   * @param sourceCurrency Source currency code
   * @param destinationCurrency Destination currency code
   * @returns Exchange rate
   */
  getExchangeRate(sourceCurrency, destinationCurrency) {
    // Use the same rates as rafikiService for consistency
    // These are approximate exchange rates (as of 2025 Q1) for demonstration
    const rates = {
      'CAD_KES': 92.5,
      'CAD_UGX': 2650.75,
      'CAD_TZS': 1820.4,
      'CAD_RWF': 890.2,
      'CAD_ZMW': 18.75,
      'CAD_MWK': 675.8,
      'CAD_ZWL': 322.5,
      'CAD_MZN': 64.3,
      'CAD_ZAR': 13.8,
      'CAD_NGN': 870.5,
      'CAD_XOF': 465.2,
      'CAD_XAF': 465.2,
      'CAD_GHS': 11.45
    };
    
    const key = `${sourceCurrency}_${destinationCurrency}`;
    return rates[key] || 80.0; // Default fallback rate
  }
}

// Export a singleton instance
const paymentService = new PaymentService();

module.exports = {
  paymentService
};