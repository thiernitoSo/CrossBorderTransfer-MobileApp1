import { v4 as uuidv4 } from 'uuid';
import { TransactionRequest, TransactionResponse, TransactionStatus, orangeMoneyService } from './orangeMoney';
import { 
  TransferRequest, 
  TransferResponse, 
  QuoteRequest, 
  QuoteResponse, 
  PaymentDestination,
  rafikiService 
} from './rafiki';

/**
 * Unified Payment Service
 * 
 * This service provides a unified interface for making payments
 * and money transfers using different payment providers.
 */

/**
 * Payment method types
 */
export type PaymentMethod = 
  | 'orange_money'
  | 'rafiki'
  | 'bank_transfer'
  | 'mobile_money'
  | 'cash_pickup';

/**
 * Payment provider types
 */
export type PaymentProvider = 
  | 'orange_money' 
  | 'rafiki';

/**
 * Payment status types (unified from all providers)
 */
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Quote data interface
 */
export interface QuoteData {
  sourceAmount?: number;
  destinationAmount?: number;
  sourceCurrency: string;
  destinationCurrency: string;
  destinationCountry: string;
  paymentMethod: PaymentMethod;
}

/**
 * Quote result interface
 */
export interface QuoteResult {
  quoteId: string;
  sourceAmount: number;
  destinationAmount: number;
  sourceCurrency: string;
  destinationCurrency: string;
  exchangeRate: number;
  fee: number;
  total: number;
  deliveryEstimate: string;
  validUntil: string;
  provider: PaymentProvider;
}

/**
 * Payment request interface
 */
export interface PaymentRequest {
  quoteId?: string;
  sourceAmount: number;
  destinationAmount: number;
  sourceCurrency: string;
  destinationCurrency: string;
  paymentMethod: PaymentMethod;
  provider: PaymentProvider;
  description?: string;
  reference?: string;
  beneficiaryId?: string;
  // Orange Money specific
  phoneNumber?: string;
  // Rafiki specific
  destination?: PaymentDestination;
}

/**
 * Payment result interface
 */
export interface PaymentResult {
  id: string;
  status: PaymentStatus;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  exchangeRate: number;
  fee: number;
  reference: string;
  provider: PaymentProvider;
  paymentUrl?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

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
  public isProviderAvailableForCountry(provider: PaymentProvider, countryCode: string): boolean {
    switch (provider) {
      case 'orange_money':
        const orangeCountries = orangeMoneyService.getSupportedCountries();
        return orangeCountries.includes(countryCode);
      case 'rafiki':
        const rafikiCountries = rafikiService.getSupportedCountries();
        return rafikiCountries.includes(countryCode);
      default:
        return false;
    }
  }

  /**
   * Check if a payment method is available for a specific country
   * @param method The payment method to check
   * @param countryCode The country code to check support for
   * @returns boolean
   */
  public isPaymentMethodAvailableForCountry(method: PaymentMethod, countryCode: string): boolean {
    switch (method) {
      case 'orange_money':
      case 'mobile_money':
        // Orange Money is primarily for mobile money in West Africa
        return this.isProviderAvailableForCountry('orange_money', countryCode);
      case 'rafiki':
      case 'bank_transfer':
      case 'cash_pickup':
        // Rafiki supports bank transfers and cash pickup in East/Southern Africa
        return this.isProviderAvailableForCountry('rafiki', countryCode);
      default:
        return false;
    }
  }

  /**
   * Get all available payment methods for a specific country
   * @param countryCode The country code to get payment methods for
   * @returns Array of available payment methods
   */
  public getAvailablePaymentMethods(countryCode: string): PaymentMethod[] {
    const methods: PaymentMethod[] = [];
    
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
  public async getQuote(data: QuoteData): Promise<QuoteResult> {
    // Determine which provider to use based on country and payment method
    const provider = this.determineProvider(data.destinationCountry, data.paymentMethod);
    
    if (provider === 'rafiki') {
      const rafikiRequest: QuoteRequest = {
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
  public async initiatePayment(data: PaymentRequest): Promise<PaymentResult> {
    const reference = data.reference || uuidv4();
    
    if (data.provider === 'rafiki') {
      // Check if destination is provided for Rafiki
      if (!data.destination) {
        throw new Error('Destination details required for Rafiki transfers');
      }
      
      const rafikiRequest: TransferRequest = {
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
      
      const orangeMoneyRequest: TransactionRequest = {
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
  public async checkPaymentStatus(id: string, provider: PaymentProvider): Promise<PaymentResult> {
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
  public async cancelPayment(id: string, provider: PaymentProvider): Promise<boolean> {
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
  private determineProvider(countryCode: string, paymentMethod: PaymentMethod): PaymentProvider {
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
  private mapToRafikiPaymentMethod(method: PaymentMethod): 'bank_account' | 'mobile_wallet' | 'cash_pickup' {
    switch (method) {
      case 'bank_transfer':
        return 'bank_account';
      case 'mobile_money':
      case 'orange_money':
        return 'mobile_wallet';
      case 'cash_pickup':
        return 'cash_pickup';
      default:
        return 'mobile_wallet';
    }
  }

  /**
   * Map payment status from provider to our unified status
   * @param status Provider status
   * @returns Our unified status
   */
  private mapStatus(status: TransactionStatus): PaymentStatus {
    // The statuses are already aligned between our providers and unified format
    return status as PaymentStatus;
  }

  /**
   * Get exchange rate between currencies
   * @param sourceCurrency Source currency code
   * @param destinationCurrency Destination currency code
   * @returns Exchange rate
   */
  private getExchangeRate(sourceCurrency: string, destinationCurrency: string): number {
    // Use the same rates as rafikiService for consistency
    // These are approximate exchange rates (as of 2025 Q1) for demonstration
    const rates: { [key: string]: number } = {
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
export const paymentService = new PaymentService();