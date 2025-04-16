const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const { v4: uuidv4 } = require('uuid');

// Create Express app
const app = express();
const PORT = 5000;

// Basic middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set up session management
const sessionMiddleware = session({
  secret: 'sendafrika-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

app.use(sessionMiddleware);

// In-memory data stores
const users = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    // Password: 'password123'
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8.7ea369caadb5e3.', 
    phoneNumber: '+14165550123',
    isVerified: true,
    createdAt: new Date().toISOString(),
    role: 'user',
  },
  {
    id: '2',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@sendafrika.com',
    // Password: 'admin123'
    password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9.7ea369caadb5e3.',
    phoneNumber: '+14165559876',
    isVerified: true,
    createdAt: new Date().toISOString(),
    role: 'admin',
  }
];

const beneficiaries = [
  {
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
  },
  {
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
  }
];

const transactions = [
  {
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
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
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
  }
];

// Money Mood Tracker data
const moodEntries = [];

// API Routes
// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running', 
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SendAfrika API Server</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
        .status { font-size: 24px; margin: 20px; }
        .success { color: green; }
        .endpoints { text-align: left; max-width: 600px; margin: 0 auto; }
        .endpoint { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>SendAfrika API Server</h1>
      <div class="status success">Server is up and running!</div>
      <div>Running on port: ${PORT}</div>
      <div>Server time: ${new Date().toISOString()}</div>
      
      <h2>Available Endpoints</h2>
      <div class="endpoints">
        <div class="endpoint">GET /api/health - Server health check</div>
        <div class="endpoint">GET /api/mood-entries/:userId - Get mood entries for a user</div>
        <div class="endpoint">POST /api/mood-entries - Create a new mood entry</div>
        <div class="endpoint">GET /api/transactions - Get transactions</div>
        <div class="endpoint">GET /api/beneficiaries - Get beneficiaries</div>
      </div>
    </body>
    </html>
  `);
});

// Mood Entries API
app.get('/api/mood-entries/:userId', (req, res) => {
  const userId = req.params.userId;
  const userMoodEntries = moodEntries.filter(entry => entry.userId === userId);
  
  res.json({
    success: true,
    data: userMoodEntries
  });
});

app.post('/api/mood-entries', (req, res) => {
  const { userId, transactionId, moodId, intensity, note } = req.body;
  
  if (!userId || !moodId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: userId, moodId'
    });
  }
  
  const newEntry = {
    id: uuidv4(),
    userId,
    transactionId,
    moodId,
    intensity: intensity || 3,
    note: note || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  moodEntries.push(newEntry);
  
  res.status(201).json({
    success: true,
    data: newEntry
  });
});

// Transactions API
app.get('/api/transactions', (req, res) => {
  const userId = req.query.userId;
  
  if (userId) {
    const userTransactions = transactions.filter(t => t.userId === userId);
    return res.json({
      success: true,
      data: userTransactions
    });
  }
  
  res.json({
    success: true,
    data: transactions
  });
});

// Beneficiaries API
app.get('/api/beneficiaries', (req, res) => {
  const userId = req.query.userId;
  
  if (userId) {
    const userBeneficiaries = beneficiaries.filter(b => b.userId === userId);
    return res.json({
      success: true,
      data: userBeneficiaries
    });
  }
  
  res.json({
    success: true,
    data: beneficiaries
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Basic server is running on http://0.0.0.0:${PORT}`);
  console.log(`Ready to accept connections on port ${PORT}`);
  
  // Self-ping to check if server is responding
  setTimeout(() => {
    const http = require('http');
    const options = {
      hostname: '0.0.0.0',
      port: PORT,
      path: '/api/health',
      method: 'GET',
    };
    
    const req = http.request(options, (res) => {
      console.log(`Server health check status: ${res.statusCode}`);
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Health check response: ${data}`);
        console.log('Server health check successful');
      });
    });
    
    req.on('error', (error) => {
      console.error('Health check error:', error.message);
    });
    
    req.end();
  }, 1000);
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;