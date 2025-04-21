import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

// Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  isVerified: boolean;
  createdAt: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  role?: 'user' | 'admin';
}

export interface Beneficiary {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  country: string;
  phoneNumber: string;
  relationship: string;
  paymentMethod: 'bank' | 'mobile_money' | 'cash_pickup';
  accountNumber?: string;
  bankName?: string;
  branchCode?: string;
  mobileMoneyProvider?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface ResetToken {
  userId: string;
  token: string;
  expiresAt: string;
}

export interface IStorage {
  sessionStore: any; // Express session store
  
  // User methods
  createUser(userData: Partial<User>): Promise<User>;
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(page: number, limit: number): Promise<User[]>;
  countUsers(): Promise<number>;
  
  // Beneficiary methods
  createBeneficiary(data: Partial<Beneficiary>): Promise<Beneficiary>;
  getBeneficiary(id: string): Promise<Beneficiary | null>;
  updateBeneficiary(id: string, data: Partial<Beneficiary>): Promise<Beneficiary>;
  deleteBeneficiary(id: string): Promise<void>;
  getBeneficiariesByUserId(userId: string): Promise<Beneficiary[]>;
  getAllBeneficiaries(page: number, limit: number): Promise<Beneficiary[]>;
  countBeneficiaries(): Promise<number>;
  
  // Transaction methods
  createTransaction(data: Partial<Transaction>): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | null>;
  updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction>;
  getTransactionsByUserId(userId: string, page: number, limit: number): Promise<Transaction[]>;
  countTransactionsByUserId(userId: string): Promise<number>;
  getAllTransactions(page: number, limit: number, filters?: { status?: string, country?: string }): Promise<Transaction[]>;
  countAllTransactions(filters?: { status?: string, country?: string }): Promise<number>;
  getTransactionStatistics(): Promise<TransactionStatistics>;
  
  // Password reset methods
  storeResetToken(userId: string, token: string): Promise<void>;
  getUserIdByResetToken(token: string): Promise<string | null>;
  deleteResetToken(token: string): Promise<void>;
}

export interface TransactionStatistics {
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
  processingCount: number;
  totalAmountCAD: number;
  currencyDistribution: Record<string, { count: number, amount: number }>;
  countryDistribution: Record<string, number>;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}

// In-memory storage implementation
class MemStorage implements IStorage {
  private users: User[] = [];
  private beneficiaries: Beneficiary[] = [];
  private transactions: Transaction[] = [];
  private resetTokens: ResetToken[] = [];
  
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Add some dummy data for testing
    this.seedTestData();
  }
  
  private seedTestData() {
    // Add regular test user
    this.users.push({
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      // Password: 'password123'
      password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8.7ea369caadb5e3.', 
      phoneNumber: '+14165550123',
      isVerified: true,
      createdAt: new Date().toISOString(),
      address: '123 Main St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 2N4',
      role: 'user',
    });
    
    // Add admin user
    this.users.push({
      id: '2',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@sendafrika.com',
      // Password: 'admin123'
      password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9.7ea369caadb5e3.',
      phoneNumber: '+14165559876',
      isVerified: true,
      createdAt: new Date().toISOString(),
      address: '456 King St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 1K4',
      role: 'admin',
    });
    
    // Add test beneficiaries
    this.beneficiaries.push({
      id: '1',
      userId: '1',
      firstName: 'Kwame',
      lastName: 'Nkrumah',
      country: 'GH',
      phoneNumber: '+233201234567',
      relationship: 'family',
      paymentMethod: 'mobile_money',
      mobileMoneyProvider: 'orange_money',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    this.beneficiaries.push({
      id: '2',
      userId: '1',
      firstName: 'Ngozi',
      lastName: 'Okonkwo',
      country: 'NG',
      phoneNumber: '+2348012345678',
      relationship: 'friend',
      paymentMethod: 'bank',
      bankName: 'First Bank of Nigeria',
      accountNumber: '1234567890',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Add test transactions
    this.transactions.push({
      id: '1',
      userId: '1',
      sourceAmount: 200,
      sourceCurrency: 'CAD',
      destinationAmount: 110150,
      destinationCurrency: 'NGN',
      exchangeRate: 550.75,
      fee: 11,
      beneficiaryId: '2',
      beneficiaryName: 'Ngozi Okonkwo',
      status: 'completed',
      statusMessage: 'Transfer completed successfully',
      paymentMethod: 'card',
      provider: 'rafiki',
      reference: 'TX12345',
      externalTransactionId: 'RAF9876543210',
      note: 'For school fees',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    
    this.transactions.push({
      id: '2',
      userId: '1',
      sourceAmount: 100,
      sourceCurrency: 'CAD',
      destinationAmount: 842,
      destinationCurrency: 'GHS',
      exchangeRate: 8.42,
      fee: 5.5,
      beneficiaryId: '1',
      beneficiaryName: 'Kwame Nkrumah',
      status: 'pending',
      statusMessage: 'Awaiting payment confirmation',
      paymentMethod: 'bank',
      provider: 'orange_money',
      reference: 'TX67890',
      externalTransactionId: 'OM12345678',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  // User methods
  async createUser(userData: Partial<User>): Promise<User> {
    const newUser: User = {
      id: uuidv4(),
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      isVerified: false,
      createdAt: new Date().toISOString(),
      ...userData,
    };
    
    this.users.push(newUser);
    return newUser;
  }
  
  async getUser(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }
  
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const index = this.users.findIndex(user => user.id === id);
    
    if (index === -1) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...this.users[index],
      ...userData,
    };
    
    this.users[index] = updatedUser;
    return updatedUser;
  }
  
  async deleteUser(id: string): Promise<void> {
    const index = this.users.findIndex(user => user.id === id);
    
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }
  
  // Beneficiary methods
  async createBeneficiary(data: Partial<Beneficiary>): Promise<Beneficiary> {
    const newBeneficiary: Beneficiary = {
      id: uuidv4(),
      userId: '',
      firstName: '',
      lastName: '',
      country: '',
      phoneNumber: '',
      relationship: '',
      paymentMethod: 'mobile_money',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    
    this.beneficiaries.push(newBeneficiary);
    return newBeneficiary;
  }
  
  async getBeneficiary(id: string): Promise<Beneficiary | null> {
    return this.beneficiaries.find(b => b.id === id) || null;
  }
  
  async updateBeneficiary(id: string, data: Partial<Beneficiary>): Promise<Beneficiary> {
    const index = this.beneficiaries.findIndex(b => b.id === id);
    
    if (index === -1) {
      throw new Error('Beneficiary not found');
    }
    
    const updatedBeneficiary = {
      ...this.beneficiaries[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    this.beneficiaries[index] = updatedBeneficiary;
    return updatedBeneficiary;
  }
  
  async deleteBeneficiary(id: string): Promise<void> {
    const index = this.beneficiaries.findIndex(b => b.id === id);
    
    if (index !== -1) {
      this.beneficiaries.splice(index, 1);
    }
  }
  
  async getBeneficiariesByUserId(userId: string): Promise<Beneficiary[]> {
    return this.beneficiaries.filter(b => b.userId === userId);
  }
  
  // Transaction methods
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: uuidv4(),
      userId: '',
      sourceAmount: 0,
      sourceCurrency: '',
      destinationAmount: 0,
      destinationCurrency: '',
      exchangeRate: 0,
      fee: 0,
      beneficiaryId: '',
      beneficiaryName: '',
      status: 'pending',
      statusMessage: '',
      paymentMethod: '',
      reference: '',
      provider: undefined,
      externalTransactionId: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    
    this.transactions.push(newTransaction);
    return newTransaction;
  }
  
  async getTransaction(id: string): Promise<Transaction | null> {
    return this.transactions.find(t => t.id === id) || null;
  }
  
  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const index = this.transactions.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Transaction not found');
    }
    
    const updatedTransaction = {
      ...this.transactions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    this.transactions[index] = updatedTransaction;
    return updatedTransaction;
  }
  
  async getTransactionsByUserId(userId: string, page: number, limit: number): Promise<Transaction[]> {
    const userTransactions = this.transactions.filter(t => t.userId === userId);
    
    // Sort by creation date, newest first
    userTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return userTransactions.slice(start, end);
  }
  
  async countTransactionsByUserId(userId: string): Promise<number> {
    return this.transactions.filter(t => t.userId === userId).length;
  }
  
  // Admin methods for user management
  async getAllUsers(page: number, limit: number): Promise<User[]> {
    // Sort by creation date, newest first
    const sortedUsers = [...this.users].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return sortedUsers.slice(start, end);
  }
  
  async countUsers(): Promise<number> {
    return this.users.length;
  }
  
  // Admin methods for beneficiary management
  async getAllBeneficiaries(page: number, limit: number): Promise<Beneficiary[]> {
    // Sort by creation date, newest first
    const sortedBeneficiaries = [...this.beneficiaries].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return sortedBeneficiaries.slice(start, end);
  }
  
  async countBeneficiaries(): Promise<number> {
    return this.beneficiaries.length;
  }
  
  // Admin methods for transaction management
  async getAllTransactions(page: number, limit: number, filters?: { status?: string, country?: string }): Promise<Transaction[]> {
    let filteredTransactions = [...this.transactions];
    
    // Apply filters if provided
    if (filters) {
      if (filters.status) {
        filteredTransactions = filteredTransactions.filter(t => t.status === filters.status);
      }
      
      if (filters.country) {
        // For country filter, we need to find all beneficiaries from that country
        const beneficiaryIds = this.beneficiaries
          .filter(b => b.country === filters.country)
          .map(b => b.id);
        
        filteredTransactions = filteredTransactions.filter(t => beneficiaryIds.includes(t.beneficiaryId));
      }
    }
    
    // Sort by creation date, newest first
    filteredTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return filteredTransactions.slice(start, end);
  }
  
  async countAllTransactions(filters?: { status?: string, country?: string }): Promise<number> {
    if (!filters) {
      return this.transactions.length;
    }
    
    let count = this.transactions.length;
    
    if (filters.status) {
      count = this.transactions.filter(t => t.status === filters.status).length;
    }
    
    if (filters.country) {
      // For country filter, we need to find all beneficiaries from that country
      const beneficiaryIds = this.beneficiaries
        .filter(b => b.country === filters.country)
        .map(b => b.id);
      
      count = this.transactions.filter(t => beneficiaryIds.includes(t.beneficiaryId)).length;
    }
    
    return count;
  }
  
  async getTransactionStatistics(): Promise<TransactionStatistics> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Transaction counts by status
    const totalCount = this.transactions.length;
    const completedCount = this.transactions.filter(t => t.status === 'completed').length;
    const pendingCount = this.transactions.filter(t => t.status === 'pending').length;
    const failedCount = this.transactions.filter(t => t.status === 'failed').length;
    const cancelledCount = this.transactions.filter(t => t.status === 'cancelled').length;
    const processingCount = this.transactions.filter(t => t.status === 'processing').length;
    
    // Total amount in CAD
    const totalAmountCAD = this.transactions.reduce((sum, t) => {
      if (t.sourceCurrency === 'CAD') {
        return sum + t.sourceAmount;
      }
      return sum;
    }, 0);
    
    // Currency distribution
    const currencyDistribution: Record<string, { count: number, amount: number }> = {};
    this.transactions.forEach(t => {
      const currency = t.destinationCurrency;
      if (!currencyDistribution[currency]) {
        currencyDistribution[currency] = { count: 0, amount: 0 };
      }
      currencyDistribution[currency].count += 1;
      currencyDistribution[currency].amount += t.destinationAmount;
    });
    
    // Country distribution - we need to map beneficiaries to countries
    const countryDistribution: Record<string, number> = {};
    this.transactions.forEach(t => {
      const beneficiary = this.beneficiaries.find(b => b.id === t.beneficiaryId);
      if (beneficiary) {
        const country = beneficiary.country;
        if (!countryDistribution[country]) {
          countryDistribution[country] = 0;
        }
        countryDistribution[country] += 1;
      }
    });
    
    // Transactions by time period
    const last24Hours = this.transactions.filter(t => 
      new Date(t.createdAt) >= oneDayAgo
    ).length;
    
    const last7Days = this.transactions.filter(t => 
      new Date(t.createdAt) >= sevenDaysAgo
    ).length;
    
    const last30Days = this.transactions.filter(t => 
      new Date(t.createdAt) >= thirtyDaysAgo
    ).length;
    
    return {
      totalCount,
      completedCount,
      pendingCount,
      failedCount,
      cancelledCount,
      processingCount,
      totalAmountCAD,
      currencyDistribution,
      countryDistribution,
      last24Hours,
      last7Days,
      last30Days
    };
  }
  
  // Password reset methods
  async storeResetToken(userId: string, token: string): Promise<void> {
    // Remove any existing tokens for this user
    this.resetTokens = this.resetTokens.filter(rt => rt.userId !== userId);
    
    // Add new token with 1 hour expiration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    this.resetTokens.push({ userId, token, expiresAt });
  }
  
  async getUserIdByResetToken(token: string): Promise<string | null> {
    // Find token and check if it's still valid
    const resetToken = this.resetTokens.find(rt => rt.token === token);
    
    if (!resetToken) {
      return null;
    }
    
    // Check if token is expired
    if (new Date(resetToken.expiresAt) < new Date()) {
      await this.deleteResetToken(token);
      return null;
    }
    
    return resetToken.userId;
  }
  
  async deleteResetToken(token: string): Promise<void> {
    this.resetTokens = this.resetTokens.filter(rt => rt.token !== token);
  }
}

// Create and export the storage instance
export const storage = new MemStorage();
