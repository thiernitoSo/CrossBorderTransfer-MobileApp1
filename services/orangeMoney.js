const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * Orange Money API Service
 * 
 * This service handles all communication with Orange Money API
 * for mobile money transactions across African countries.
 */

/**
 * Orange Money API Service class
 */
class OrangeMoneyService {
  constructor() {
    this.baseUrl = 'https://api.orange.com/orange-money-webpay';
    this.apiKey = process.env.ORANGE_MONEY_API_KEY;
    this.clientId = process.env.ORANGE_MONEY_CLIENT_ID;
    this.clientSecret = process.env.ORANGE_MONEY_CLIENT_SECRET;
    
    // Check if credentials are available
    this.isAvailable = !!(this.apiKey && this.clientId && this.clientSecret);
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      async (config) => {
        // Add token if available and not expired
        if (this.isAvailable) {
          // Check if token is expired
          if (!this.accessToken || Date.now() >= this.tokenExpiry) {
            try {
              await this.authenticate();
            } catch (error) {
              console.error('Authentication failed:', error);
              throw new Error('Failed to authenticate with Orange Money API');
            }
          }
          
          if (this.accessToken) {
            config.headers['Authorization'] = `Bearer ${this.accessToken}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Authenticate with Orange Money API
   * @returns Promise<void>
   */
  async authenticate() {
    if (!this.isAvailable) {
      throw new Error('Orange Money API credentials not configured');
    }

    try {
      // Basic authentication with client credentials
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        'https://api.orange.com/oauth/v3/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set token expiry time (subtract 5 minutes for safety)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - (5 * 60 * 1000);
    } catch (error) {
      console.error('Authentication error:', error);
      this.accessToken = null;
      throw new Error('Failed to authenticate with Orange Money API');
    }
  }

  /**
   * Check if service is available
   * @returns boolean
   */
  isServiceAvailable() {
    return this.isAvailable;
  }

  /**
   * Initiate a payment transaction
   * @param data Transaction request data
   * @returns Promise<TransactionResponse>
   */
  async initiatePayment(data) {
    if (!this.isAvailable) {
      return this.mockTransactionResponse(data, 'failed');
    }

    try {
      const reference = data.externalReference || uuidv4();
      
      const payload = {
        amount: data.amount,
        currency: data.currency,
        phoneNumber: data.phoneNumber,
        reference: reference,
        description: data.description,
        callbackUrl: data.callbackUrl || `${process.env.API_BASE_URL}/api/payments/callback`
      };

      const response = await this.client.post('/v1/payments', payload);
      
      return {
        id: response.data.paymentId,
        status: 'pending',
        amount: data.amount,
        currency: data.currency,
        phoneNumber: data.phoneNumber,
        reference: reference,
        paymentUrl: response.data.paymentUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Orange Money payment initiation error:', error);
      return this.mockTransactionResponse(data, 'failed');
    }
  }

  /**
   * Check the status of a transaction
   * @param transactionId The ID of the transaction to check
   * @returns Promise<TransactionResponse>
   */
  async checkTransactionStatus(transactionId) {
    if (!this.isAvailable) {
      return {
        id: transactionId,
        status: 'failed',
        amount: 0,
        currency: 'XOF',
        phoneNumber: '',
        reference: '',
        message: 'Orange Money API not configured',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    try {
      const response = await this.client.get(`/v1/payments/${transactionId}`);
      
      return {
        id: transactionId,
        status: this.mapPaymentStatus(response.data.status),
        amount: response.data.amount,
        currency: response.data.currency,
        phoneNumber: response.data.phoneNumber,
        reference: response.data.reference,
        message: response.data.message,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      };
    } catch (error) {
      console.error('Orange Money status check error:', error);
      return {
        id: transactionId,
        status: 'failed',
        amount: 0,
        currency: 'XOF',
        phoneNumber: '',
        reference: '',
        message: 'Failed to check transaction status',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Cancel a transaction that is still pending
   * @param transactionId The ID of the transaction to cancel
   * @returns Promise<boolean>
   */
  async cancelTransaction(transactionId) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      await this.client.post(`/v1/payments/${transactionId}/cancel`);
      return true;
    } catch (error) {
      console.error('Orange Money cancel transaction error:', error);
      return false;
    }
  }

  /**
   * Get supported countries
   * @returns Array of supported country codes
   */
  getSupportedCountries() {
    // West African countries where Orange Money is active
    return ['SN', 'CI', 'ML', 'GN', 'BF', 'NE', 'LR', 'SL'];
  }

  /**
   * Map Orange Money payment status to our system status
   * @param status The status string from Orange Money
   * @returns TransactionStatus
   */
  mapPaymentStatus(status) {
    const statusLower = status.toLowerCase();
    if (['initiated', 'pending'].includes(statusLower)) {
      return 'pending';
    }
    if (['processing'].includes(statusLower)) {
      return 'processing';
    }
    if (['successful', 'completed'].includes(statusLower)) {
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
   * Generate a mock transaction response when API is unavailable
   * @param data The transaction request data
   * @param status The status to assign
   * @returns TransactionResponse
   */
  mockTransactionResponse(data, status) {
    const reference = data.externalReference || uuidv4();
    
    return {
      id: uuidv4(),
      status: status,
      amount: data.amount,
      currency: data.currency,
      phoneNumber: data.phoneNumber,
      reference: reference,
      message: 'Orange Money API not configured, using mock response',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

// Export a singleton instance
const orangeMoneyService = new OrangeMoneyService();

module.exports = {
  orangeMoneyService
};