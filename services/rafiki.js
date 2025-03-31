const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * Rafiki API Service
 * 
 * This service handles all communication with Rafiki API
 * for cross-border money transfers to Eastern and Southern Africa.
 */

/**
 * Rafiki API Service class
 */
class RafikiService {
  constructor() {
    this.baseUrl = 'https://api.rafiki.africa';
    this.apiKey = process.env.RAFIKI_API_KEY;
    
    // Check if credentials are available
    this.isAvailable = !!this.apiKey;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        if (this.isAvailable && this.apiKey) {
          config.headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Check if service is available
   * @returns boolean
   */
  isServiceAvailable() {
    return this.isAvailable;
  }

  /**
   * Get a price quote for a money transfer
   * @param data Quote request data
   * @returns Promise<QuoteResponse>
   */
  async getQuote(data) {
    if (!this.isAvailable) {
      return this.mockQuoteResponse(data);
    }

    try {
      const response = await this.client.post('/v1/quotes', data);
      
      return {
        quoteId: response.data.quoteId,
        sourceAmount: response.data.sourceAmount,
        destinationAmount: response.data.destinationAmount,
        sourceCurrency: response.data.sourceCurrency,
        destinationCurrency: response.data.destinationCurrency,
        exchangeRate: response.data.exchangeRate,
        fee: response.data.fee,
        deliveryEstimate: response.data.deliveryEstimate,
        validUntil: response.data.validUntil
      };
    } catch (error) {
      console.error('Rafiki quote error:', error);
      return this.mockQuoteResponse(data);
    }
  }

  /**
   * Initiate a money transfer
   * @param data Transfer request data
   * @returns Promise<TransferResponse>
   */
  async initiateTransfer(data) {
    if (!this.isAvailable) {
      return this.mockTransferResponse(data, 'failed');
    }

    try {
      const reference = data.reference || uuidv4();
      
      const payload = {
        amount: data.amount,
        sourceCurrency: data.sourceCurrency,
        destinationCurrency: data.destinationCurrency,
        reference: reference,
        description: data.description || 'Money transfer',
        destination: data.destination,
        callbackUrl: data.callbackUrl || `${process.env.API_BASE_URL}/api/payments/rafiki-callback`
      };

      const response = await this.client.post('/v1/transfers', payload);
      
      return {
        id: response.data.transferId,
        status: this.mapTransferStatus(response.data.status),
        sourceAmount: response.data.sourceAmount,
        sourceCurrency: response.data.sourceCurrency,
        destinationAmount: response.data.destinationAmount,
        destinationCurrency: response.data.destinationCurrency,
        exchangeRate: response.data.exchangeRate,
        fee: response.data.fee,
        reference: reference,
        paymentUrl: response.data.paymentUrl,
        createdAt: response.data.createdAt || new Date().toISOString(),
        updatedAt: response.data.updatedAt || new Date().toISOString()
      };
    } catch (error) {
      console.error('Rafiki transfer initiation error:', error);
      return this.mockTransferResponse(data, 'failed');
    }
  }

  /**
   * Check the status of a transfer
   * @param transferId The ID of the transfer to check
   * @returns Promise<TransferResponse>
   */
  async checkTransferStatus(transferId) {
    if (!this.isAvailable) {
      return {
        id: transferId,
        status: 'failed',
        sourceAmount: 0,
        sourceCurrency: 'CAD',
        destinationAmount: 0,
        destinationCurrency: 'KES',
        exchangeRate: 0,
        fee: 0,
        reference: '',
        message: 'Rafiki API not configured',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    try {
      const response = await this.client.get(`/v1/transfers/${transferId}`);
      
      return {
        id: transferId,
        status: this.mapTransferStatus(response.data.status),
        sourceAmount: response.data.sourceAmount,
        sourceCurrency: response.data.sourceCurrency,
        destinationAmount: response.data.destinationAmount,
        destinationCurrency: response.data.destinationCurrency,
        exchangeRate: response.data.exchangeRate,
        fee: response.data.fee,
        reference: response.data.reference,
        message: response.data.message,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      };
    } catch (error) {
      console.error('Rafiki transfer status check error:', error);
      return {
        id: transferId,
        status: 'failed',
        sourceAmount: 0,
        sourceCurrency: 'CAD',
        destinationAmount: 0,
        destinationCurrency: 'KES',
        exchangeRate: 0,
        fee: 0,
        reference: '',
        message: 'Failed to check transfer status',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Cancel a transfer that is still pending
   * @param transferId The ID of the transfer to cancel
   * @returns Promise<boolean>
   */
  async cancelTransfer(transferId) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      await this.client.post(`/v1/transfers/${transferId}/cancel`);
      return true;
    } catch (error) {
      console.error('Rafiki cancel transfer error:', error);
      return false;
    }
  }

  /**
   * Get supported countries
   * @returns Array of supported country codes
   */
  getSupportedCountries() {
    // Eastern and Southern African countries where Rafiki operates
    return ['KE', 'UG', 'TZ', 'RW', 'ZM', 'MW', 'ZW', 'MZ', 'ZA'];
  }

  /**
   * Map Rafiki transfer status to our system status
   * @param status The status string from Rafiki
   * @returns TransactionStatus
   */
  mapTransferStatus(status) {
    const statusLower = status.toLowerCase();
    if (['created', 'pending'].includes(statusLower)) {
      return 'pending';
    }
    if (['processing', 'in_progress'].includes(statusLower)) {
      return 'processing';
    }
    if (['completed', 'success'].includes(statusLower)) {
      return 'completed';
    }
    if (['failed', 'rejected'].includes(statusLower)) {
      return 'failed';
    }
    if (['cancelled'].includes(statusLower)) {
      return 'cancelled';
    }
    return 'pending';
  }

  /**
   * Generate a mock quote response when API is unavailable
   * @param data The quote request data
   * @returns QuoteResponse
   */
  mockQuoteResponse(data) {
    const exchangeRate = this.getMockExchangeRate(data.sourceCurrency, data.destinationCurrency);
    const sourceAmount = data.sourceAmount || (data.destinationAmount ? data.destinationAmount / exchangeRate : 100);
    const destinationAmount = data.destinationAmount || (data.sourceAmount ? data.sourceAmount * exchangeRate : 0);
    const fee = sourceAmount * 0.04; // 4% fee
    
    return {
      quoteId: uuidv4(),
      sourceAmount: sourceAmount,
      destinationAmount: destinationAmount,
      sourceCurrency: data.sourceCurrency,
      destinationCurrency: data.destinationCurrency,
      exchangeRate: exchangeRate,
      fee: fee,
      deliveryEstimate: '1-2 business days',
      validUntil: new Date(Date.now() + (15 * 60 * 1000)).toISOString() // Valid for 15 minutes
    };
  }

  /**
   * Generate a mock transfer response when API is unavailable
   * @param data The transfer request data
   * @param status The status to assign
   * @returns TransferResponse
   */
  mockTransferResponse(data, status) {
    const reference = data.reference || uuidv4();
    const exchangeRate = this.getMockExchangeRate(data.sourceCurrency, data.destinationCurrency);
    const sourceAmount = data.sourceAmount || data.amount || 0;
    const destinationAmount = data.destinationAmount || (sourceAmount * exchangeRate);
    const fee = sourceAmount * 0.04; // 4% fee
    
    return {
      id: uuidv4(),
      status: status,
      sourceAmount: sourceAmount,
      sourceCurrency: data.sourceCurrency,
      destinationAmount: destinationAmount,
      destinationCurrency: data.destinationCurrency,
      exchangeRate: exchangeRate,
      fee: fee,
      reference: reference,
      message: 'Rafiki API not configured, using mock response',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get a mock exchange rate for testing
   * @param sourceCurrency Source currency code
   * @param destinationCurrency Destination currency code
   * @returns Mock exchange rate
   */
  getMockExchangeRate(sourceCurrency, destinationCurrency) {
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
const rafikiService = new RafikiService();

module.exports = {
  rafikiService
};