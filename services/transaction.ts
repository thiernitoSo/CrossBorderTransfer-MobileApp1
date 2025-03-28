import apiService from './api';
import { getData, storeData, STORAGE_KEYS } from '../utils/storage';
import { getExchangeRate, calculateFee } from '../constants/currencies';

export interface Transaction {
  id: string;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  exchangeRate: number;
  fee: number;
  beneficiaryId: string;
  beneficiaryName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: string;
  reference: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  amount: number;
  beneficiaryId: string;
  destinationCurrency: string;
  paymentMethod: string;
  note?: string;
}

export interface TransactionQuote {
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  exchangeRate: number;
  fee: number;
  totalAmount: number;
  expiresAt: string;
}

/**
 * Get all transactions for current user
 */
export const getTransactions = async (
  page = 1,
  limit = 10
): Promise<{
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    const response = await apiService.get<{
      data: Transaction[];
      total: number;
      page: number;
      limit: number;
    }>('/transactions', { page, limit });
    
    // Cache recent transactions
    if (page === 1) {
      await storeData(STORAGE_KEYS.RECENT_TRANSACTIONS, response.data);
    }
    
    return response;
  } catch (error) {
    console.error('Get transactions error:', error);
    
    // If API fails and requesting first page, try to get cached transactions
    if (page === 1) {
      const cachedTransactions = await getData<Transaction[]>(STORAGE_KEYS.RECENT_TRANSACTIONS);
      if (cachedTransactions) {
        return {
          data: cachedTransactions,
          total: cachedTransactions.length,
          page: 1,
          limit,
        };
      }
    }
    
    throw error;
  }
};

/**
 * Get transaction by ID
 */
export const getTransaction = async (id: string): Promise<Transaction> => {
  try {
    return await apiService.get<Transaction>(`/transactions/${id}`);
  } catch (error) {
    console.error(`Get transaction ${id} error:`, error);
    
    // If API fails, try to get from cached transactions
    const cachedTransactions = await getData<Transaction[]>(STORAGE_KEYS.RECENT_TRANSACTIONS);
    const cachedTransaction = cachedTransactions?.find(t => t.id === id);
    
    if (cachedTransaction) {
      return cachedTransaction;
    }
    
    throw error;
  }
};

/**
 * Get transaction quote
 */
export const getTransactionQuote = async (
  amount: number,
  sourceCurrency: string,
  destinationCurrency: string
): Promise<TransactionQuote> => {
  try {
    return await apiService.post<TransactionQuote>('/transactions/quote', {
      amount,
      sourceCurrency,
      destinationCurrency,
    });
  } catch (error) {
    console.error('Get transaction quote error:', error);
    
    // If API fails, generate a fallback quote using our local logic
    // This is only for demo purposes and should use real API in production
    const exchangeRate = getExchangeRate(sourceCurrency, destinationCurrency);
    const destinationAmount = amount * exchangeRate;
    const fee = calculateFee(amount);
    
    const fallbackQuote: TransactionQuote = {
      sourceAmount: amount,
      sourceCurrency,
      destinationAmount,
      destinationCurrency,
      exchangeRate,
      fee,
      totalAmount: amount + fee,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
    };
    
    return fallbackQuote;
  }
};

/**
 * Create new transaction
 */
export const createTransaction = async (
  data: CreateTransactionData
): Promise<Transaction> => {
  try {
    const newTransaction = await apiService.post<Transaction>('/transactions', data);
    
    // Update local cache of recent transactions
    const cachedTransactions = await getData<Transaction[]>(STORAGE_KEYS.RECENT_TRANSACTIONS) || [];
    await storeData(STORAGE_KEYS.RECENT_TRANSACTIONS, [newTransaction, ...cachedTransactions].slice(0, 10));
    
    return newTransaction;
  } catch (error) {
    console.error('Create transaction error:', error);
    throw error;
  }
};

/**
 * Cancel transaction (only if status is pending)
 */
export const cancelTransaction = async (id: string): Promise<Transaction> => {
  try {
    const updatedTransaction = await apiService.post<Transaction>(`/transactions/${id}/cancel`);
    
    // Update local cache
    const cachedTransactions = await getData<Transaction[]>(STORAGE_KEYS.RECENT_TRANSACTIONS) || [];
    const updatedCache = cachedTransactions.map(t => 
      t.id === id ? updatedTransaction : t
    );
    
    await storeData(STORAGE_KEYS.RECENT_TRANSACTIONS, updatedCache);
    
    return updatedTransaction;
  } catch (error) {
    console.error(`Cancel transaction ${id} error:`, error);
    throw error;
  }
};

/**
 * Get recent transaction statistics
 */
export const getTransactionStats = async (): Promise<{
  totalSent: number;
  totalCount: number;
  averageAmount: number;
}> => {
  try {
    return await apiService.get<{
      totalSent: number;
      totalCount: number;
      averageAmount: number;
    }>('/transactions/stats');
  } catch (error) {
    console.error('Get transaction stats error:', error);
    
    // If API fails, generate stats from cached transactions
    const cachedTransactions = await getData<Transaction[]>(STORAGE_KEYS.RECENT_TRANSACTIONS) || [];
    
    const totalSent = cachedTransactions.reduce((sum, t) => sum + t.sourceAmount + t.fee, 0);
    const totalCount = cachedTransactions.length;
    const averageAmount = totalCount > 0 ? totalSent / totalCount : 0;
    
    return { totalSent, totalCount, averageAmount };
  }
};

export const transactionService = {
  getTransactions,
  getTransaction,
  getTransactionQuote,
  createTransaction,
  cancelTransaction,
  getTransactionStats,
};

export default transactionService;
