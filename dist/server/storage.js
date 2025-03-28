import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

// Types
export 

export 

export 

export 

export 

// In-memory storage implementation
class MemStorage implements IStorage {
  private users = [];
  private beneficiaries = [];
  private transactions = [];
  private resetTokens = [];
  
  sessionStore.Store;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Add some dummy data for testing
    this.seedTestData();
  }
  
  private seedTestData() {
    // Add test user
    this.users.push({
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      // Password: 'password123'
      password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8.7ea369caadb5e3.', 
      phoneNumber: '+14165550123',
      isVerified,
      createdAt Date().toISOString(),
      address: '123 Main St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 2N4',
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
      createdAt Date().toISOString(),
      updatedAt Date().toISOString(),
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
      createdAt Date().toISOString(),
      updatedAt Date().toISOString(),
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
      paymentMethod: 'card',
      reference: 'TX12345',
      note: 'For school fees',
      createdAt Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updatedAt Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      paymentMethod: 'bank',
      reference: 'TX67890',
      createdAt Date().toISOString(),
      updatedAt Date().toISOString(),
    });
  }
  
  // User methods
  async createUser(userData) {
    const newUser = {
      id4(),
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      isVerified,
      createdAt Date().toISOString(),
      ...userData,
    };
    
    this.users.push(newUser);
    return newUser;
  }
  
  async getUser(id) | null> {
    return this.users.find(user => user.id === id) || null;
  }
  
  async getUserByEmail(email) | null> {
    return this.users.find(user => user.email === email) || null;
  }
  
  async updateUser(id, userData) {
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
  
  async deleteUser(id) {
    const index = this.users.findIndex(user => user.id === id);
    
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }
  
  // Beneficiary methods
  async createBeneficiary(data) {
    const newBeneficiary = {
      id4(),
      userId: '',
      firstName: '',
      lastName: '',
      country: '',
      phoneNumber: '',
      relationship: '',
      paymentMethod: 'mobile_money',
      createdAt Date().toISOString(),
      updatedAt Date().toISOString(),
      ...data,
    };
    
    this.beneficiaries.push(newBeneficiary);
    return newBeneficiary;
  }
  
  async getBeneficiary(id) | null> {
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
      updatedAt Date().toISOString(),
    };
    
    this.beneficiaries[index] = updatedBeneficiary;
    return updatedBeneficiary;
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
  
  // Transaction methods
  async createTransaction(data) {
    const newTransaction = {
      id4(),
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
      paymentMethod: '',
      reference: '',
      createdAt Date().toISOString(),
      updatedAt Date().toISOString(),
      ...data,
    };
    
    this.transactions.push(newTransaction);
    return newTransaction;
  }
  
  async getTransaction(id) | null> {
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
      updatedAt Date().toISOString(),
    };
    
    this.transactions[index] = updatedTransaction;
    return updatedTransaction;
  }
  
  async getTransactionsByUserId(userId, page, limit) {
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
  
  async countTransactionsByUserId(userId) {
    return this.transactions.filter(t => t.userId === userId).length;
  }
  
  // Password reset methods
  async storeResetToken(userId, token) {
    // Remove any existing tokens for this user
    this.resetTokens = this.resetTokens.filter(rt => rt.userId !== userId);
    
    // Add new token with 1 hour expiration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    this.resetTokens.push({ userId, token, expiresAt });
  }
  
  async getUserIdByResetToken(token) | null> {
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
  
  async deleteResetToken(token) {
    this.resetTokens = this.resetTokens.filter(rt => rt.token !== token);
  }
}

// Create and export the storage instance
export const storage = new MemStorage();
