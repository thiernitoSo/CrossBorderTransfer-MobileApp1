const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const { promisify } = require('util');
const MemoryStore = require('memorystore')(session);
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

// Import payment services if available
let orangeMoneyService, rafikiService, paymentService;
let openaiService;

try {
  // These services are written in TypeScript, so we need to check if they're compiled
  orangeMoneyService = require('./services/orangeMoney').orangeMoneyService;
  rafikiService = require('./services/rafiki').rafikiService;
  paymentService = require('./services/payment').paymentService;
  console.log('Payment services loaded successfully');
} catch (error) {
  console.warn('Payment services not available:', error.message);
}

// Load the OpenAI service for AI-powered features
try {
  openaiService = require('./services/openaiService');
  console.log('OpenAI service loaded successfully');
} catch (error) {
  console.warn('Could not load OpenAI service:', error.message);
  console.warn('AI-powered features will not be available');
}

// Create Express application
const app = express();
const PORT = process.env.PORT || 5000; // Use port 5000 which is standard for Replit

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
      createdAt: new Date().toISOString()
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
    
    this.users[index] = { ...this.users[index], ...userData };
    return this.users[index];
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
      reference: 'TRX' + Date.now().toString().slice(-8),
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

const storage = new MemStorage();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public')); // Serve static files from the 'public' directory

// Session and authentication setup
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
}

// Set up session
app.use(session({
  secret: process.env.SESSION_SECRET || 'sendafrika-secret-key',
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Auth routes
app.post('/api/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create new user
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      isVerified: false,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Log in the user
    req.login(userWithoutPassword, (err) => {
      if (err) return next(err);
      res.status(201).json(userWithoutPassword);
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});

app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info?.message || 'Invalid email or password' });
    }

    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    });
  })(req, res, next);
});

app.post('/api/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  res.json(req.user);
});

// Password reset routes
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    
    // Generate reset token
    const token = crypto.randomBytes(20).toString('hex');
    await storage.storeResetToken(user.id, token);
    
    // In a real app, send email with reset link
    console.log(`Reset token for ${email}: ${token}`);
    
    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Verify token
    const userId = await storage.getUserIdByResetToken(token);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Update password
    const hashedPassword = await hashPassword(password);
    await storage.updateUser(userId, { password: hashedPassword });
    
    // Remove the used token
    await storage.deleteResetToken(token);
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Verify current password
    const user = await storage.getUser(userId);
    if (!user || !(await comparePasswords(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUser(userId, { password: hashedPassword });
    
    res.status(200).json({ message: 'Password has been changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Beneficiary routes
app.get('/api/beneficiaries', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const beneficiaries = await storage.getBeneficiariesByUserId(req.user.id);
    res.json(beneficiaries);
  } catch (error) {
    console.error('Get beneficiaries error:', error);
    res.status(500).json({ message: 'Failed to get beneficiaries' });
  }
});

app.get('/api/beneficiaries/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const beneficiary = await storage.getBeneficiary(req.params.id);
    
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found' });
    }
    
    if (beneficiary.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this beneficiary' });
    }
    
    res.json(beneficiary);
  } catch (error) {
    console.error('Get beneficiary error:', error);
    res.status(500).json({ message: 'Failed to get beneficiary' });
  }
});

app.post('/api/beneficiaries', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const newBeneficiary = await storage.createBeneficiary({
      ...req.body,
      userId: req.user.id
    });
    
    res.status(201).json(newBeneficiary);
  } catch (error) {
    console.error('Create beneficiary error:', error);
    res.status(500).json({ message: 'Failed to create beneficiary' });
  }
});

app.put('/api/beneficiaries/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const beneficiary = await storage.getBeneficiary(req.params.id);
    
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found' });
    }
    
    if (beneficiary.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this beneficiary' });
    }
    
    const updatedBeneficiary = await storage.updateBeneficiary(req.params.id, req.body);
    res.json(updatedBeneficiary);
  } catch (error) {
    console.error('Update beneficiary error:', error);
    res.status(500).json({ message: 'Failed to update beneficiary' });
  }
});

app.delete('/api/beneficiaries/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const beneficiary = await storage.getBeneficiary(req.params.id);
    
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found' });
    }
    
    if (beneficiary.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this beneficiary' });
    }
    
    await storage.deleteBeneficiary(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    console.error('Delete beneficiary error:', error);
    res.status(500).json({ message: 'Failed to delete beneficiary' });
  }
});

// Transaction routes
app.get('/api/transactions', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const transactions = await storage.getTransactionsByUserId(req.user.id, page, limit);
    const total = await storage.countTransactionsByUserId(req.user.id);
    
    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to get transactions' });
  }
});

app.get('/api/transactions/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const transaction = await storage.getTransaction(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this transaction' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Failed to get transaction' });
  }
});

// Sample exchange rates (in a real app, these would come from an API)
const exchangeRates = {
  'CAD': {
    'NGN': 375,
    'GHS': 6.5,
    'KES': 103,
    'ZAR': 13.2,
    'UGX': 3500,
    'XOF': 480, // West African CFA
    'XAF': 480  // Central African CFA
  }
};

app.post('/api/transactions/quote', async (req, res) => {
  try {
    const { amount, sourceCurrency = 'CAD', destinationCurrency } = req.body;
    
    if (!amount || !destinationCurrency) {
      return res.status(400).json({ message: 'Amount and destination currency are required' });
    }
    
    // Get exchange rate
    const exchangeRate = exchangeRates[sourceCurrency]?.[destinationCurrency] || 0;
    if (!exchangeRate) {
      return res.status(400).json({ message: 'Unsupported currency pair' });
    }
    
    // Calculate fee (simplified fee structure)
    const fee = amount * 0.05; // 5% fee
    
    // Calculate destination amount
    const destinationAmount = (amount - fee) * exchangeRate;
    
    res.json({
      sourceAmount: amount,
      sourceCurrency,
      destinationAmount,
      destinationCurrency,
      exchangeRate,
      fee,
      totalAmount: amount,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes expiry
    });
  } catch (error) {
    console.error('Get transaction quote error:', error);
    res.status(500).json({ message: 'Failed to get transaction quote' });
  }
});

app.post('/api/transactions', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const { amount, beneficiaryId, destinationCurrency, paymentMethod, note } = req.body;
    
    if (!amount || !beneficiaryId || !destinationCurrency || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Get beneficiary
    const beneficiary = await storage.getBeneficiary(beneficiaryId);
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found' });
    }
    
    if (beneficiary.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to use this beneficiary' });
    }
    
    // Get exchange rate
    const sourceCurrency = 'CAD'; // Hardcoded for now
    const exchangeRate = exchangeRates[sourceCurrency]?.[destinationCurrency] || 0;
    if (!exchangeRate) {
      return res.status(400).json({ message: 'Unsupported currency pair' });
    }
    
    // Calculate fee
    const fee = amount * 0.05; // 5% fee
    
    // Calculate destination amount
    const destinationAmount = (amount - fee) * exchangeRate;
    
    // Create transaction
    const transaction = await storage.createTransaction({
      userId: req.user.id,
      sourceAmount: amount,
      sourceCurrency,
      destinationAmount,
      destinationCurrency,
      exchangeRate,
      fee,
      beneficiaryId,
      beneficiaryName: `${beneficiary.firstName} ${beneficiary.lastName}`,
      status: 'pending',
      paymentMethod,
      note
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Failed to create transaction' });
  }
});

app.post('/api/transactions/:id/cancel', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const transaction = await storage.getTransaction(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this transaction' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending transactions can be cancelled' });
    }
    
    const updatedTransaction = await storage.updateTransaction(req.params.id, { status: 'cancelled' });
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Cancel transaction error:', error);
    res.status(500).json({ message: 'Failed to cancel transaction' });
  }
});

app.get('/api/transactions/stats', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const allTransactions = await storage.getTransactionsByUserId(req.user.id);
    
    // Calculate total sent
    const totalSent = allTransactions.reduce((sum, t) => {
      return t.status === 'completed' ? sum + t.sourceAmount : sum;
    }, 0);
    
    // Count by currency
    const sentByCurrency = {};
    allTransactions.forEach(t => {
      if (t.status === 'completed') {
        if (!sentByCurrency[t.destinationCurrency]) {
          sentByCurrency[t.destinationCurrency] = 0;
        }
        sentByCurrency[t.destinationCurrency] += t.destinationAmount;
      }
    });
    
    res.json({
      totalTransactions: allTransactions.length,
      completedTransactions: allTransactions.filter(t => t.status === 'completed').length,
      pendingTransactions: allTransactions.filter(t => t.status === 'pending').length,
      totalSentCAD: totalSent,
      sentByCurrency
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ message: 'Failed to get transaction statistics' });
  }
});

// User profile update
app.put('/api/users/profile', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      address,
      city,
      province,
      postalCode
    } = req.body;
    
    const updatedUser = await storage.updateUser(req.user.id, {
      firstName,
      lastName,
      phoneNumber,
      address,
      city,
      province,
      postalCode
    });
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// AI support chat endpoints (simulated in this version)
// In a production application, this would use the OpenAI API with gpt-4o model
// 
// PRODUCTION IMPLEMENTATION:
// To implement the actual OpenAI integration:
// 1. Install the OpenAI package: npm install openai
// 2. Set up the OPENAI_API_KEY environment variable in your .env file
// 3. Initialize the OpenAI client with the API key
// 4. Replace the generateResponse function with actual API calls
// 
// Example OpenAI integration code:
// ```
// const OpenAI = require('openai');
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// 
// app.post('/api/chat', async (req, res) => {
//   try {
//     const { messages } = req.body;
//     
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o", // The newest model as of May 2024
//       messages: messages,
//     });
//     
//     res.json(response.choices[0].message);
//   } catch (error) {
//     res.status(500).json({ message: 'Error with OpenAI API', error: error.message });
//   }
// });
// ```

// Helper function to generate responses based on keywords
// Used as a fallback when OpenAI API is not available
function generateResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('exchange rate') || lowerMessage.includes('rate')) {
    return "Exchange rates are updated daily based on market conditions. We typically offer competitive rates for transfers to African countries. For example, our current rates are approximately:\n- 1 CAD = 375 NGN (Nigerian Naira)\n- 1 CAD = 6.5 GHS (Ghanaian Cedi)\n- 1 CAD = 103 KES (Kenyan Shilling)";
  }
  
  if (lowerMessage.includes('fee') || lowerMessage.includes('cost') || lowerMessage.includes('charge')) {
    return "Our fee structure is transparent and competitive. We charge a 5% fee on all transfers, which is deducted from the amount you send. For example, if you send $100 CAD, the fee would be $5 CAD, and $95 CAD equivalent would be delivered to your recipient.";
  }
  
  if (lowerMessage.includes('time') || lowerMessage.includes('how long') || lowerMessage.includes('duration') || lowerMessage.includes('receive')) {
    return "Transfer times vary depending on the destination country and payment method. Typically:\n- Mobile money transfers: 10-30 minutes\n- Bank transfers: 1-2 business days\n- Cash pickups: Available within hours of sending";
  }
  
  if (lowerMessage.includes('payment method') || lowerMessage.includes('pay') || lowerMessage.includes('send money')) {
    return "We accept several payment methods including:\n- Debit cards\n- Credit cards\n- Bank transfers\nThe recipient can receive funds via:\n- Mobile money (MTN, Airtel, etc.)\n- Bank deposit\n- Cash pickup at partner locations";
  }
  
  if (lowerMessage.includes('country') || lowerMessage.includes('africa') || lowerMessage.includes('send to')) {
    return "SendAfrika currently supports money transfers from Canada to several African countries including:\n- Nigeria\n- Ghana\n- Kenya\n- South Africa\n- Uganda\n- Senegal\n- Côte d'Ivoire\nWe're continuously expanding to more countries!";
  }
  
  if (lowerMessage.includes('safe') || lowerMessage.includes('secure') || lowerMessage.includes('fraud')) {
    return "Security is our top priority. We use industry-standard encryption and security protocols to protect your data and transactions. All transfers are monitored for fraud prevention, and we verify all recipient information before completing transfers.";
  }
  
  if (lowerMessage.includes('account') || lowerMessage.includes('sign up') || lowerMessage.includes('register')) {
    return "Setting up an account is easy and free! Simply click the 'Sign Up' button, provide your basic information, and verify your email. You'll need to complete our KYC (Know Your Customer) process, which helps us maintain security and comply with regulations.";
  }
  
  if (lowerMessage.includes('thank')) {
    return "You're welcome! I'm happy to help with any questions about SendAfrika's services. If you need anything else, feel free to ask!";
  }
  
  // Default response
  return "I'm Rafiki, your AI assistant for SendAfrika! I can help answer questions about cross-border money transfers from Canada to African countries. You can ask about exchange rates, fees, transfer times, supported countries, payment methods, and more. How can I assist you today?";
}

// Export the function for use in openaiService.js
module.exports.generateResponse = generateResponse;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Invalid messages format. Expected an array of message objects.' });
    }
    
    // Get the last user message
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();
    
    if (!lastUserMessage || !lastUserMessage.content) {
      return res.json({
        role: 'assistant',
        content: "I'm Rafiki, your AI assistant for SendAfrika! How can I help you today?"
      });
    }
    
    // Use OpenAI service with fallback to rule-based responses
    let responseContent;
    try {
      responseContent = await openaiService.generateChatResponse(messages);
    } catch (aiError) {
      console.error('OpenAI error, using fallback:', aiError);
      responseContent = generateResponse(lastUserMessage.content);
    }
    
    // Log the interaction
    console.log('User:', lastUserMessage.content);
    console.log('Rafiki:', responseContent);
    
    res.json({
      role: 'assistant',
      content: responseContent
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Failed to process chat request', error: error.message });
  }
});

app.post('/api/analyze-transaction', async (req, res) => {
  try {
    const { transactionData } = req.body;
    
    if (!transactionData) {
      return res.status(400).json({ message: 'Transaction data is required' });
    }
    
    // Try to use OpenAI for analysis first
    const openaiAnalysis = await openaiService.analyzeTransaction(transactionData);
    
    // If OpenAI analysis is available, use it
    if (openaiAnalysis) {
      return res.json(openaiAnalysis);
    }
    
    // Fallback to rule-based analysis if OpenAI is not available
    console.log('Using rule-based transaction analysis (OpenAI unavailable)');
    
    // Simple rule-based analysis
    const amount = transactionData.sourceAmount || 0;
    const paymentMethod = transactionData.paymentMethod || '';
    const destCountry = transactionData.destinationCountry || '';
    
    let risk = 'low';
    let confidence = 0.9;
    let flags = [];
    let recommendation = 'approve';
    let explanation = 'This transaction appears to be legitimate and follows normal patterns.';
    
    // Large amount check
    if (amount > 3000) {
      risk = 'high';
      confidence = 0.8;
      flags.push('Large transaction amount');
      recommendation = 'review';
      explanation = 'The transaction amount exceeds the threshold for automatic approval.';
    } else if (amount > 1000) {
      risk = 'medium';
      confidence = 0.85;
      flags.push('Moderately large transaction amount');
      recommendation = 'approve';
      explanation = 'The transaction amount is notable but within normal ranges.';
    }
    
    // Payment method check
    if (paymentMethod.includes('prepaid')) {
      risk = 'medium';
      confidence = 0.75;
      flags.push('Prepaid payment method');
      explanation += ' Prepaid payment methods require additional verification.';
      
      if (risk === 'high') {
        confidence = 0.85;
      } else {
        recommendation = 'review';
      }
    }
    
    // Country risk assessment
    const highRiskCountries = ['SD', 'SO', 'LY'];
    if (highRiskCountries.includes(destCountry)) {
      risk = 'high';
      confidence = 0.95;
      flags.push('High-risk destination country');
      recommendation = 'review';
      explanation = 'The destination country requires enhanced due diligence.';
    }
    
    // First-time transaction bonus check
    if (transactionData.isFirstTime) {
      if (risk === 'low') {
        explanation += ' This is the sender\'s first transaction, which typically indicates lower risk.';
      } else {
        explanation += ' However, this is the sender\'s first transaction, which requires standard verification.';
      }
    }
    
    res.json({
      risk,
      confidence,
      flags,
      recommendation,
      explanation
    });
  } catch (error) {
    console.error('Transaction analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze transaction', error: error.message });
  }
});

// Payment API routes (Orange Money and Rafiki integration)
// Only available if the payment services are loaded
if (paymentService) {
  // Check available payment providers for a country
  app.get('/api/payments/providers/:countryCode', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { countryCode } = req.params;
      const providers = await paymentService.getAvailableProvidersForCountry(countryCode);
      res.json({ providers });
    } catch (error) {
      console.error('Error getting payment providers:', error);
      res.status(500).json({ message: 'Failed to get payment providers', error: error.message });
    }
  });

  // Get exchange rate information
  app.get('/api/payments/exchange-rate', async (req, res) => {
    try {
      const { sourceCurrency, destinationCurrency } = req.query;
      
      if (!sourceCurrency || !destinationCurrency) {
        return res.status(400).json({ message: 'Source and destination currencies are required' });
      }
      
      const exchangeRate = await paymentService.getExchangeRateInfo(
        sourceCurrency.toString(),
        destinationCurrency.toString()
      );
      
      res.json(exchangeRate);
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      res.status(500).json({ message: 'Failed to get exchange rate', error: error.message });
    }
  });

  // Initiate a payment transfer
  app.post('/api/payments/transfer', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const paymentRequest = req.body;
      
      // Add user ID to the sender info
      paymentRequest.senderInfo = {
        ...paymentRequest.senderInfo,
        userId: req.user.id,
      };
      
      // Get beneficiary details if beneficiaryId is provided but not beneficiary info
      if (paymentRequest.recipientInfo?.beneficiaryId && 
          (!paymentRequest.recipientInfo.firstName || !paymentRequest.recipientInfo.lastName)) {
        const beneficiary = await storage.getBeneficiary(paymentRequest.recipientInfo.beneficiaryId);
        if (beneficiary && beneficiary.userId === req.user.id) {
          paymentRequest.recipientInfo = {
            ...paymentRequest.recipientInfo,
            firstName: beneficiary.firstName,
            lastName: beneficiary.lastName,
            phone: beneficiary.phoneNumber,
            country: beneficiary.country,
            accountNumber: beneficiary.accountNumber,
            bankName: beneficiary.bankName,
            branchCode: beneficiary.branchCode,
            mobileMoneyProvider: beneficiary.mobileMoneyProvider,
            relationship: beneficiary.relationship,
          };
        }
      }
      
      const result = await paymentService.initiateTransfer(paymentRequest);
      
      // Create a transaction record in our database
      const newTransaction = await storage.createTransaction({
        userId: req.user.id,
        sourceAmount: result.sourceAmount,
        sourceCurrency: result.sourceCurrency,
        destinationAmount: result.destinationAmount,
        destinationCurrency: result.destinationCurrency,
        exchangeRate: result.exchangeRate,
        fee: result.fee,
        beneficiaryId: paymentRequest.recipientInfo.beneficiaryId,
        beneficiaryName: `${paymentRequest.recipientInfo.firstName} ${paymentRequest.recipientInfo.lastName}`,
        status: result.status,
        paymentMethod: result.paymentMethod,
        provider: result.provider,
        reference: result.reference,
        externalTransactionId: result.transactionId,
        note: paymentRequest.note || '',
      });
      
      res.status(201).json({
        ...result,
        transactionId: newTransaction.id,
      });
    } catch (error) {
      console.error('Error initiating payment transfer:', error);
      res.status(500).json({ message: 'Failed to initiate payment transfer', error: error.message });
    }
  });

  // Check payment status
  app.get('/api/payments/:id/status', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { id } = req.params;
      
      // Get transaction from our database
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      if (transaction.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to access this transaction' });
      }
      
      // If the transaction has an external transaction ID and provider, check the status
      if (transaction.externalTransactionId && transaction.provider) {
        try {
          const status = await paymentService.checkTransactionStatus(
            transaction.externalTransactionId,
            transaction.provider
          );
          
          // Update transaction status in our database if it has changed
          if (status.status !== transaction.status) {
            await storage.updateTransaction(id, {
              status: status.status,
              statusMessage: status.statusMessage,
            });
          }
          
          res.json({
            transactionId: id,
            externalTransactionId: transaction.externalTransactionId,
            status: status.status,
            statusMessage: status.statusMessage,
            updatedAt: status.updatedAt,
          });
        } catch (error) {
          // If external status check fails, return current status from our database
          console.error('Error checking external payment status:', error);
          res.json({
            transactionId: id,
            externalTransactionId: transaction.externalTransactionId,
            status: transaction.status,
            statusMessage: 'Unable to check external payment status. Using last known status.',
            updatedAt: transaction.updatedAt,
          });
        }
      } else {
        // If no external transaction ID or provider, just return current status from our database
        res.json({
          transactionId: id,
          status: transaction.status,
          updatedAt: transaction.updatedAt,
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      res.status(500).json({ message: 'Failed to check payment status', error: error.message });
    }
  });
}

// OpenAI-powered AI features
if (openaiService) {
  // Customer support chat endpoint
  app.post('/api/ai/support', async (req, res) => {
    try {
      const { query, userContext } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: 'Query is required' });
      }
      
      // Add user authentication context if available
      let context = userContext || {};
      if (req.isAuthenticated()) {
        context = {
          ...context,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          country: 'Canada' // Default for now
        };
        
        // Get user's recent transactions for context (last 2)
        const recentTransactions = await storage.getTransactionsByUserId(req.user.id, 1, 2);
        if (recentTransactions && recentTransactions.length > 0) {
          context.recentTransactions = `${recentTransactions.length} recent transfers to ${recentTransactions.map(t => t.destinationCurrency).join(', ')}`;
        }
      }
      
      const response = await openaiService.getCustomerSupportResponse(query, context);
      res.json({ response });
    } catch (error) {
      console.error('AI support error:', error);
      res.status(500).json({ 
        message: 'Failed to process support query',
        error: error.message,
        fallbackResponse: 'I apologize, but I encountered an issue processing your request. Please try again later or contact our customer support team directly.'
      });
    }
  });
  
  // Transaction analysis endpoint
  app.post('/api/transactions/:id/analyze', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const transaction = await storage.getTransaction(req.params.id);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      if (transaction.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to access this transaction' });
      }
      
      // Get the beneficiary to determine recipient country
      let recipientCountry = '';
      if (transaction.beneficiaryId) {
        const beneficiary = await storage.getBeneficiary(transaction.beneficiaryId);
        if (beneficiary) {
          recipientCountry = beneficiary.country;
        }
      }
      
      // Add recipient country to transaction data for analysis
      const transactionForAnalysis = {
        ...transaction,
        recipientCountry
      };
      
      const analysis = await openaiService.analyzeTransaction(transactionForAnalysis);
      res.json(analysis);
    } catch (error) {
      console.error('Transaction analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze transaction', error: error.message });
    }
  });
  
  // Country transfer tips endpoint
  app.get('/api/ai/country-tips/:countryCode', async (req, res) => {
    try {
      const { countryCode } = req.params;
      
      if (!countryCode || countryCode.length !== 2) {
        return res.status(400).json({ message: 'Valid country code is required (ISO 2-letter code)' });
      }
      
      const tips = await openaiService.getCountryTransferTips(countryCode);
      res.json(tips);
    } catch (error) {
      console.error('Country tips error:', error);
      res.status(500).json({ message: 'Failed to get country tips', error: error.message });
    }
  });
}

// Start the server
// Catch-all route to serve the SPA for any non-API routes
app.get('*', (req, res) => {
  // Don't handle API routes here
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Send the index.html file for all other routes
  res.sendFile('index.html', { root: './public' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Access the application at: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
});