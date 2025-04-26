//import express, { json, urlencoded } from 'express';
const express = require('express');
import cors from 'cors';
import session from 'express-session';
import { initialize, session as _session, use, serializeUser, deserializeUser, authenticate } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { config } from 'dotenv';
import { storage } from './storage';
import { testConnection } from './db';
import { initializeTables } from './schema';

// Load environment variables
config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Express middlewares
app.use(cors({
  origin: true, // Allow any origin in development (customize in production)
  credentials: true // Allow cookies to be sent
}));
app.use(json());
app.use(urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'sendafrika-secret-key',
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

// Passport authentication setup
app.use(initialize());
app.use(_session());

// Password hashing utilities
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  // For development only - direct comparison if no hash format detected
  if (!stored.includes('.')) {
    return supplied === stored;
  }

  try {
    // Regular scrypt comparison for production
    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

// Passport local strategy
use(new LocalStrategy(
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

serializeUser((user, done) => done(null, user.id));
deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Auth middleware for protected routes
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized. Please log in.' });
}

// Admin middleware for protected routes
export function isAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}

// Admin routes
app.get('/api/admin/stats', isAdmin, async (req, res) => {
  try {
    const stats = await storage.getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to get admin statistics' });
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
  authenticate('local', (err, user, info) => {
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
  // Remove password from response
  const { password, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
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
    const token = randomBytes(20).toString('hex');
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

app.post('/api/auth/change-password', isAuthenticated, async (req, res) => {
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
app.get('/api/beneficiaries', isAuthenticated, async (req, res) => {
  try {
    const beneficiaries = await storage.getBeneficiariesByUserId(req.user.id);
    res.json(beneficiaries);
  } catch (error) {
    console.error('Get beneficiaries error:', error);
    res.status(500).json({ message: 'Failed to get beneficiaries' });
  }
});

app.get('/api/beneficiaries/:id', isAuthenticated, async (req, res) => {
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

app.post('/api/beneficiaries', isAuthenticated, async (req, res) => {
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

app.put('/api/beneficiaries/:id', isAuthenticated, async (req, res) => {
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

app.delete('/api/beneficiaries/:id', isAuthenticated, async (req, res) => {
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

// Transaction routes
app.get('/api/transactions', isAuthenticated, async (req, res) => {
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

app.get('/api/transactions/:id', isAuthenticated, async (req, res) => {
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

app.post('/api/transactions', isAuthenticated, async (req, res) => {
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

app.post('/api/transactions/:id/cancel', isAuthenticated, async (req, res) => {
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

app.get('/api/transactions/stats', isAuthenticated, async (req, res) => {
  try {
    // Implement transaction statistics
    const stats = await storage.getTransactionStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ message: 'Failed to get transaction statistics' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to connect to PostgreSQL database. Exiting...');
      process.exit(1);
    }

    // Initialize database tables
    const tablesCreated = await initializeTables();
    if (!tablesCreated) {
      console.error('Failed to create database tables. Exiting...');
      process.exit(1);
    }

    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();