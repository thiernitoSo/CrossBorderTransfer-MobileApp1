import { get, post, put, del } from './api';

export interface Transaction {
  id: string;
  userId: string;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  exchangeRate: number;
  fee: number;
  beneficiaryId: string;
  beneficiaryName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  statusMessage?: string;
  paymentMethod: string;
  provider?: string;
  reference: string;
  externalTransactionId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteRequest {
  sourceAmount?: number;
  destinationAmount?: number;
  sourceCurrency: string;
  destinationCurrency: string;
  beneficiaryId?: string;
}

export interface Quote {
  id: string;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  exchangeRate: number;
  fee: number;
  totalAmount: number;
  validUntil: string;
}

export interface TransactionRequest {
  quoteId: string;
  beneficiaryId: string;
  paymentMethod: string;
  note?: string;
}

export interface TransactionStats {
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
  totalSent: {
    amount: number;
    currency: string;
  };
  averageAmount: {
    amount: number;
    currency: string;
  };
  lastTransactionDate: string;
}

/**
 * Get all transactions for the current user
 */
export const getTransactions = async (page: number = 1, limit: number = 10): Promise<{
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  try {
    return await get('/api/transactions', { page, limit });
  } catch (error) {
    console.error('Failed to get transactions:', error);
    throw error;
  }
};

/**
 * Get a single transaction by ID
 */
export const getTransaction = async (id: string): Promise<Transaction> => {
  try {
    return await get(`/api/transactions/${id}`);
  } catch (error) {
    console.error(`Failed to get transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new money transfer quote
 */
export const createQuote = async (quoteRequest: QuoteRequest): Promise<Quote> => {
  try {
    return await post('/api/transactions/quote', quoteRequest);
  } catch (error) {
    console.error('Failed to create quote:', error);
    throw error;
  }
};

/**
 * Create a new transaction
 */
export const createTransaction = async (transactionRequest: TransactionRequest): Promise<Transaction> => {
  try {
    return await post('/api/transactions', transactionRequest);
  } catch (error) {
    console.error('Failed to create transaction:', error);
    throw error;
  }
};

/**
 * Cancel a transaction
 */
export const cancelTransaction = async (id: string): Promise<Transaction> => {
  try {
    return await post(`/api/transactions/${id}/cancel`);
  } catch (error) {
    console.error(`Failed to cancel transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Get transaction statistics
 */
export const getTransactionStats = async (): Promise<TransactionStats> => {
  try {
    return await get('/api/transactions/stats');
  } catch (error) {
    console.error('Failed to get transaction stats:', error);
    throw error;
  }
};

export default {
  getTransactions,
  getTransaction,
  createQuote,
  createTransaction,
  cancelTransaction,
  getTransactionStats,
};