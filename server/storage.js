const { v4: uuidv4 } = require('uuid');
const { sessionStore, hasDatabaseCredentials } = require('./db');
const crypto = require('crypto');

// Memory storage implementation for fallback
class MemStorage {
  constructor() {
    this.users = [];
    this.beneficiaries = [];
    this.transactions = [];
    this.resetTokens = [];
    this.sessionStore = sessionStore;
    
    // Seed some test data
    this.seedTestData();
  }
  
  seedTestData() {
    // Only seed if no data exists
    if (this.users.length === 0) {
      // Create a test admin user
      this.users.push({
        id: '1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        phoneNumber: '+1234567890',
        password: 'admin123', // stored as plain text for development only
        isVerified: true,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      
      // Create a test regular user
      this.users.push({
        id: '2',
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        phoneNumber: '+9876543210',
        password: 'admin123', // stored as plain text for development only
        isVerified: true,
        role: 'user',
        createdAt: new Date().toISOString()
      });
      
      // Create some test beneficiaries
      this.beneficiaries.push({
        id: '1',
        userId: '2',
        firstName: 'John',
        lastName: 'Doe',
        country: 'GHA',
        phoneNumber: '+233123456789',
        relationship: 'Friend',
        paymentMethod: 'mobile_money',
        mobileMoneyProvider: 'MTN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Create some test transactions
      this.transactions.push({
        id: '1',
        userId: '2',
        sourceAmount: 100,
        sourceCurrency: 'CAD',
        destinationAmount: 650,
        destinationCurrency: 'GHS',
        exchangeRate: 6.5,
        fee: 5,
        beneficiaryId: '1',
        beneficiaryName: 'John Doe',
        status: 'completed',
        paymentMethod: 'credit_card',
        reference: 'TRX12345',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('Test data seeded with 2 users, 1 beneficiary, and 1 transaction');
    }
  }
  
  async createUser(userData) {
    const newUser = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...userData
    };
    
    this.users.push(newUser);
    return newUser;
  }
  
  async getUser(id) {
    return this.users.find(u => u.id === id) || null;
  }
  
  async getUserByEmail(email) {
    return this.users.find(u => u.email === email) || null;
  }
  
  async updateUser(id, userData) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    this.users[index] = updatedUser;
    return updatedUser;
  }
  
  async deleteUser(id) {
    this.users = this.users.filter(u => u.id !== id);
  }
  
  async getAllUsers(page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    return this.users.slice(startIndex, endIndex);
  }
  
  async countUsers() {
    return this.users.length;
  }
  
  async createBeneficiary(data) {
    const newBeneficiary = {
      id: uuidv4(),
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
    if (index === -1) {
      throw new Error('Beneficiary not found');
    }
    
    const updatedBeneficiary = {
      ...this.beneficiaries[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.beneficiaries[index] = updatedBeneficiary;
    return updatedBeneficiary;
  }
  
  async deleteBeneficiary(id) {
    this.beneficiaries = this.beneficiaries.filter(b => b.id !== id);
  }
  
  async getBeneficiariesByUserId(userId) {
    return this.beneficiaries.filter(b => b.userId === userId);
  }
  
  async getAllBeneficiaries(page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    return this.beneficiaries.slice(startIndex, endIndex);
  }
  
  async countBeneficiaries() {
    return this.beneficiaries.length;
  }
  
  async createTransaction(data) {
    const newTransaction = {
      id: uuidv4(),
      reference: `TRX${Math.floor(100000 + Math.random() * 900000)}`,
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
    if (index === -1) {
      throw new Error('Transaction not found');
    }
    
    const updatedTransaction = {
      ...this.transactions[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.transactions[index] = updatedTransaction;
    return updatedTransaction;
  }
  
  async getTransactionsByUserId(userId, page = 1, limit = 10) {
    const filteredTransactions = this.transactions.filter(t => t.userId === userId);
    
    // Sort by createdAt in descending order (newest first)
    filteredTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    return filteredTransactions.slice(startIndex, endIndex);
  }
  
  async countTransactionsByUserId(userId) {
    return this.transactions.filter(t => t.userId === userId).length;
  }
  
  async getAllTransactions(page, limit, filters = {}) {
    let filteredTransactions = [...this.transactions];
    
    if (filters.status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === filters.status);
    }
    
    if (filters.country) {
      // This would involve joining with beneficiaries in a real DB
      const beneficiariesInCountry = this.beneficiaries.filter(b => b.country === filters.country);
      const beneficiaryIds = beneficiariesInCountry.map(b => b.id);
      filteredTransactions = filteredTransactions.filter(t => beneficiaryIds.includes(t.beneficiaryId));
    }
    
    // Sort by createdAt in descending order (newest first)
    filteredTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    return filteredTransactions.slice(startIndex, endIndex);
  }
  
  async countAllTransactions(filters = {}) {
    let count = this.transactions.length;
    
    if (filters.status) {
      count = this.transactions.filter(t => t.status === filters.status).length;
    }
    
    if (filters.country) {
      const beneficiariesInCountry = this.beneficiaries.filter(b => b.country === filters.country);
      const beneficiaryIds = beneficiariesInCountry.map(b => b.id);
      count = this.transactions.filter(t => beneficiaryIds.includes(t.beneficiaryId)).length;
    }
    
    return count;
  }
  
  async getTransactionStatistics() {
    const totalCount = this.transactions.length;
    const completedCount = this.transactions.filter(t => t.status === 'completed').length;
    const pendingCount = this.transactions.filter(t => t.status === 'pending').length;
    const failedCount = this.transactions.filter(t => t.status === 'failed').length;
    const cancelledCount = this.transactions.filter(t => t.status === 'cancelled').length;
    const processingCount = this.transactions.filter(t => t.status === 'processing').length;
    
    // Calculate total amount in CAD
    const totalAmountCAD = this.transactions.reduce((sum, t) => {
      return t.sourceCurrency === 'CAD' ? sum + t.sourceAmount : sum;
    }, 0);
    
    // Calculate currency distribution
    const currencyDistribution = {};
    this.transactions.forEach(t => {
      const currency = t.destinationCurrency;
      if (!currencyDistribution[currency]) {
        currencyDistribution[currency] = { count: 0, amount: 0 };
      }
      currencyDistribution[currency].count++;
      currencyDistribution[currency].amount += t.destinationAmount;
    });
    
    // Calculate country distribution
    const countryDistribution = {};
    this.transactions.forEach(t => {
      const beneficiary = this.beneficiaries.find(b => b.id === t.beneficiaryId);
      if (beneficiary) {
        const country = beneficiary.country;
        countryDistribution[country] = (countryDistribution[country] || 0) + 1;
      }
    });
    
    // Calculate recent transactions
    const now = new Date();
    const last24Hours = this.transactions.filter(t => {
      const createdAt = new Date(t.createdAt);
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    }).length;
    
    const last7Days = this.transactions.filter(t => {
      const createdAt = new Date(t.createdAt);
      const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;
    
    const last30Days = this.transactions.filter(t => {
      const createdAt = new Date(t.createdAt);
      const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    }).length;
    
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
  
  async storeResetToken(userId, token) {
    // First, remove any existing tokens for this user
    this.resetTokens = this.resetTokens.filter(rt => rt.userId !== userId);
    
    // Create expiration date (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Store new token
    this.resetTokens.push({
      userId,
      token,
      expiresAt: expiresAt.toISOString()
    });
  }
  
  async getUserIdByResetToken(token) {
    const resetToken = this.resetTokens.find(rt => rt.token === token);
    
    if (!resetToken) {
      return null;
    }
    
    // Check if token is expired
    if (new Date(resetToken.expiresAt) < new Date()) {
      this.deleteResetToken(token);
      return null;
    }
    
    return resetToken.userId;
  }
  
  async deleteResetToken(token) {
    this.resetTokens = this.resetTokens.filter(rt => rt.token !== token);
  }
}

// For now, we'll use the memory storage implementation
// In a production app, this would be replaced with database implementations
const storage = new MemStorage();

module.exports = {
  storage,
  MemStorage
};