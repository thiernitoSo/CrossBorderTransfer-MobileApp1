/**
 * Storage implementation for SendAfrika
 * Supports both in-memory storage and PostgreSQL database
 */

const { v4: uuidv4 } = require('uuid');

// Try to load required modules
let session, memorystore, PostgresSessionStore, postgresAdapter;
let MemoryStore = null;

try {
  session = require('express-session');
  memorystore = require('memorystore');
  MemoryStore = memorystore(session);
  
  try {
    PostgresSessionStore = require('./pg-session-store');
    postgresAdapter = require('./postgres-adapter');
  } catch (error) {
    console.log('PostgreSQL adapter modules not available:', error.message);
  }
} catch (error) {
  console.error('Session modules not available:', error.message);
}

// In-memory storage
class MemStorage {
  constructor() {
    this.users = [];
    this.beneficiaries = [];
    this.transactions = [];
    this.resetTokens = [];
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Seed test data
    this.seedTestData();
  }
  
  seedTestData() {
    // Create a test user
    this.users.push({
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '+15551234567',
      // Password: 'password123'
      password: '8743b52063cd84097a65d1633f5c74f5a40efa2d044e8a10e262e62b6c0cd8d8.29eeec87b99e20ae',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Create a test admin user
    this.users.push({
      id: '2',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      phoneNumber: '+15559876543',
      // Password: 'admin123'
      password: '04cb677ba40479917064f7cb92c12ee47e1cc48c5c349ebff106c6133a42619052a4258c3225e5abf662d6888b366a0f647ade9df59635b82bd0b0a97f314e17.29eeec87b99e20ae',
      isVerified: true,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Create test beneficiaries
    this.beneficiaries.push({
      id: '1',
      userId: '1',
      firstName: 'Alice',
      lastName: 'Smith',
      country: 'NG',
      phoneNumber: '+2347012345678',
      relationship: 'Family',
      paymentMethod: 'mobile_money',
      mobileMoneyProvider: 'MTN Mobile Money',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    this.beneficiaries.push({
      id: '2',
      userId: '1',
      firstName: 'Bob',
      lastName: 'Johnson',
      country: 'GH',
      phoneNumber: '+233501234567',
      relationship: 'Friend',
      paymentMethod: 'bank',
      bankName: 'Ghana Commercial Bank',
      accountNumber: '1234567890',
      branchCode: 'ACC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Create test transactions
    this.transactions.push({
      id: '1',
      userId: '1',
      sourceAmount: 100,
      sourceCurrency: 'CAD',
      destinationAmount: 37500,
      destinationCurrency: 'NGN',
      exchangeRate: 375,
      fee: 5,
      beneficiaryId: '1',
      beneficiaryName: 'Alice Smith',
      status: 'completed',
      paymentMethod: 'credit_card',
      reference: 'TRX' + Date.now().toString().slice(-8),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    this.transactions.push({
      id: '2',
      userId: '1',
      sourceAmount: 50,
      sourceCurrency: 'CAD',
      destinationAmount: 15000,
      destinationCurrency: 'NGN',
      exchangeRate: 375,
      fee: 2.5,
      beneficiaryId: '1',
      beneficiaryName: 'Alice Smith',
      status: 'pending',
      paymentMethod: 'debit_card',
      reference: 'TRX' + Date.now().toString().slice(-8),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('Test data seeded with', this.users.length, 'users,', 
                this.beneficiaries.length, 'beneficiaries, and', 
                this.transactions.length, 'transactions');
  }
  
  // User methods
  async createUser(userData) {
    const newUser = {
      id: uuidv4(),
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      phoneNumber: userData.phoneNumber || '',
      password: userData.password || '',
      isVerified: userData.isVerified !== undefined ? userData.isVerified : false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...userData
    };
    
    this.users.push(newUser);
    return newUser;
  }
  
  async getUser(id) {
    return this.users.find(user => user.id === id) || null;
  }
  
  async getUserByEmail(email) {
    return this.users.find(user => user.email === email) || null;
  }
  
  async updateUser(id, userData) {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) throw new Error('User not found');
    
    this.users[index] = { 
      ...this.users[index], 
      ...userData,
      updatedAt: new Date().toISOString()
    };
    return this.users[index];
  }
  
  async deleteUser(id) {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }
  
  async getAllUsers(page, limit) {
    const offset = (page - 1) * limit;
    return this.users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }
  
  async countUsers() {
    return this.users.length;
  }
  
  // Beneficiary methods
  async createBeneficiary(data) {
    const newBeneficiary = {
      id: uuidv4(),
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      country: data.country || '',
      phoneNumber: data.phoneNumber || '',
      relationship: data.relationship || '',
      paymentMethod: data.paymentMethod || 'bank',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    
    this.beneficiaries.push(newBeneficiary);
    return newBeneficiary;
  }
  
  async getBeneficiary(id) {
    return this.beneficiaries.find(b => b.id === id) || null;
  }
  
  async updateBeneficiary(id, data) {
    const index = this.beneficiaries.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Beneficiary not found');
    
    this.beneficiaries[index] = { 
      ...this.beneficiaries[index], 
      ...data,
      updatedAt: new Date().toISOString()
    };
    return this.beneficiaries[index];
  }
  
  async deleteBeneficiary(id) {
    const index = this.beneficiaries.findIndex(b => b.id === id);
    if (index !== -1) {
      this.beneficiaries.splice(index, 1);
    }
  }
  
  async getBeneficiariesByUserId(userId) {
    return this.beneficiaries.filter(b => b.userId === userId);
  }
  
  async getAllBeneficiaries(page, limit) {
    const offset = (page - 1) * limit;
    return this.beneficiaries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }
  
  async countBeneficiaries() {
    return this.beneficiaries.length;
  }
  
  // Transaction methods
  async createTransaction(data) {
    const newTransaction = {
      id: uuidv4(),
      sourceAmount: data.sourceAmount || 0,
      sourceCurrency: data.sourceCurrency || 'CAD',
      destinationAmount: data.destinationAmount || 0,
      destinationCurrency: data.destinationCurrency || '',
      exchangeRate: data.exchangeRate || 0,
      fee: data.fee || 0,
      beneficiaryId: data.beneficiaryId || '',
      beneficiaryName: data.beneficiaryName || '',
      status: data.status || 'pending',
      paymentMethod: data.paymentMethod || '',
      reference: data.reference || 'TRX' + Date.now().toString().slice(-8),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    
    this.transactions.push(newTransaction);
    return newTransaction;
  }
  
  async getTransaction(id) {
    return this.transactions.find(t => t.id === id) || null;
  }
  
  async updateTransaction(id, data) {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found');
    
    this.transactions[index] = { 
      ...this.transactions[index], 
      ...data,
      updatedAt: new Date().toISOString()
    };
    return this.transactions[index];
  }
  
  async getTransactionsByUserId(userId, page = 1, limit = 10) {
    const transactions = this.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const startIndex = (page - 1) * limit;
    return transactions.slice(startIndex, startIndex + limit);
  }
  
  async countTransactionsByUserId(userId) {
    return this.transactions.filter(t => t.userId === userId).length;
  }
  
  async getAllTransactions(page, limit, filters = {}) {
    let filteredTransactions = [...this.transactions];
    
    // Apply filters
    if (filters.status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === filters.status);
    }
    
    if (filters.country) {
      // For country filter, find beneficiaries from that country
      const beneficiaryIds = this.beneficiaries
        .filter(b => b.country === filters.country)
        .map(b => b.id);
      
      filteredTransactions = filteredTransactions.filter(t => 
        beneficiaryIds.includes(t.beneficiaryId)
      );
    }
    
    // Sort and paginate
    filteredTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const startIndex = (page - 1) * limit;
    return filteredTransactions.slice(startIndex, startIndex + limit);
  }
  
  async countAllTransactions(filters = {}) {
    let count = this.transactions.length;
    
    // Apply filters
    if (filters.status) {
      count = this.transactions.filter(t => t.status === filters.status).length;
    }
    
    if (filters.country) {
      // For country filter, find beneficiaries from that country
      const beneficiaryIds = this.beneficiaries
        .filter(b => b.country === filters.country)
        .map(b => b.id);
      
      count = this.transactions.filter(t => 
        beneficiaryIds.includes(t.beneficiaryId)
      ).length;
    }
    
    return count;
  }
  
  async getTransactionStatistics() {
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Transaction counts by status
    const totalCount = this.transactions.length;
    const completedCount = this.transactions.filter(t => t.status === 'completed').length;
    const pendingCount = this.transactions.filter(t => t.status === 'pending').length;
    const failedCount = this.transactions.filter(t => t.status === 'failed').length;
    const cancelledCount = this.transactions.filter(t => t.status === 'cancelled').length;
    const processingCount = this.transactions.filter(t => t.status === 'processing').length;
    
    // Total amount in CAD
    const totalAmountCAD = this.transactions
      .filter(t => t.sourceCurrency === 'CAD')
      .reduce((sum, t) => sum + t.sourceAmount, 0);
    
    // Currency distribution
    const currencyDistribution = {};
    this.transactions.forEach(t => {
      if (!currencyDistribution[t.destinationCurrency]) {
        currencyDistribution[t.destinationCurrency] = { count: 0, amount: 0 };
      }
      currencyDistribution[t.destinationCurrency].count++;
      currencyDistribution[t.destinationCurrency].amount += t.destinationAmount;
    });
    
    // Country distribution
    const countryDistribution = {};
    this.transactions.forEach(t => {
      const beneficiary = this.beneficiaries.find(b => b.id === t.beneficiaryId);
      if (beneficiary) {
        if (!countryDistribution[beneficiary.country]) {
          countryDistribution[beneficiary.country] = 0;
        }
        countryDistribution[beneficiary.country]++;
      }
    });
    
    // Time-based statistics
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
  async storeResetToken(userId, token) {
    this.resetTokens.push({
      userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });
  }
  
  async getUserIdByResetToken(token) {
    const resetToken = this.resetTokens.find(rt => 
      rt.token === token && new Date(rt.expiresAt) > new Date()
    );
    return resetToken ? resetToken.userId : null;
  }
  
  async deleteResetToken(token) {
    const index = this.resetTokens.findIndex(rt => rt.token === token);
    if (index !== -1) {
      this.resetTokens.splice(index, 1);
    }
  }
}

// Factory function to create the appropriate storage implementation
async function createStorage() {
  console.log('Initializing storage...');
  
  // Check if PostgreSQL modules and database are available
  if (postgresAdapter && process.env.DATABASE_URL) {
    console.log('Database credentials detected. Attempting to connect to PostgreSQL...');
    
    try {
      // Initialize PostgreSQL connection
      const { initializePostgres, ensureTablesExist, PostgresAdapter } = postgresAdapter;
      const pgResult = await initializePostgres();
      
      if (pgResult.success) {
        console.log('PostgreSQL connection successful');
        
        // Ensure tables exist
        const tablesResult = await ensureTablesExist();
        
        if (tablesResult.success) {
          console.log('PostgreSQL tables ready. Using database storage.');
          return new PostgresAdapter();
        } else {
          console.error('Failed to initialize PostgreSQL tables:', tablesResult.message);
        }
      } else {
        console.error('Failed to connect to PostgreSQL:', pgResult.message);
      }
      
      console.log('Falling back to in-memory storage');
    } catch (error) {
      console.error('PostgreSQL initialization error:', error);
      console.log('Falling back to in-memory storage');
    }
  } else {
    if (!postgresAdapter) {
      console.log('PostgreSQL adapter not available. Using in-memory storage.');
    } else if (!process.env.DATABASE_URL) {
      console.log('No database credentials found. Using in-memory storage.');
    }
  }
  
  // Check if session store is available
  if (!MemoryStore) {
    console.error('Memory store not available. Unable to create session store.');
    throw new Error('Memory store not available');
  }
  
  // Fall back to in-memory storage
  return new MemStorage();
}

// Initialize storage
let storageInstance = null;

// Export a getter function to ensure storage is initialized
module.exports = {
  getStorage: async function() {
    if (!storageInstance) {
      storageInstance = await createStorage();
    }
    return storageInstance;
  }
};