const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const crypto = require('crypto');
const { promisify } = require('util');
const memorystore = require('memorystore');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const connectPgSimple = require('connect-pg-simple');

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 5000; // Use port 5000 which is standard for Replit

// Check if we have a database URL
const hasDbCredentials = !!process.env.DATABASE_URL;
console.log('Database URL available:', hasDbCredentials);

// Setup PostgreSQL connection
let pool;
let PgStore;

if (hasDbCredentials) {
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for some hosted PostgreSQL providers
    }
  });
  
  // Test the connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Error connecting to PostgreSQL database:', err);
      console.log('Falling back to in-memory storage.');
    } else {
      console.log('Successfully connected to PostgreSQL database.');
      
      // Create tables if they don't exist
      createTables();
    }
  });
  
  // Setup Postgres session store
  PgStore = connectPgSimple(session);
}

// Create required tables if they don't exist
async function createTables() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone_number VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        address VARCHAR(255),
        city VARCHAR(100),
        province VARCHAR(100),
        postal_code VARCHAR(20),
        role VARCHAR(20) DEFAULT 'user'
      )
    `);
    
    // Create beneficiaries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        country VARCHAR(2) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        relationship VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        account_number VARCHAR(50),
        bank_name VARCHAR(100),
        branch_code VARCHAR(50),
        mobile_money_provider VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        source_amount DECIMAL(10,2) NOT NULL,
        source_currency VARCHAR(3) NOT NULL,
        destination_amount DECIMAL(10,2) NOT NULL,
        destination_currency VARCHAR(3) NOT NULL,
        exchange_rate DECIMAL(10,6) NOT NULL,
        fee DECIMAL(10,2) NOT NULL,
        beneficiary_id INTEGER REFERENCES beneficiaries(id),
        beneficiary_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        status_message TEXT,
        payment_method VARCHAR(50) NOT NULL,
        provider VARCHAR(100),
        reference VARCHAR(100) NOT NULL,
        external_transaction_id VARCHAR(100),
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create reset_tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create session table for connect-pg-simple
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
  }
}

// Storage class for PostgreSQL
class DbStorage {
  constructor() {
    this.sessionStore = hasDbCredentials 
      ? new PgStore({ 
          pool, 
          tableName: 'session',
          createTableIfMissing: true
        }) 
      : new memorystore(session)({
          checkPeriod: 86400000 // prune expired entries every 24h
        });
  }
  
  // User methods
  async createUser(userData) {
    try {
      // Generate UUID if not provided
      if (!userData.id) {
        userData.id = uuidv4();
      }
      
      const query = `
        INSERT INTO users (
          first_name, last_name, email, phone_number, password, 
          is_verified, address, city, province, postal_code, role
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, first_name, last_name, email, phone_number, 
                 is_verified, created_at, address, city, province, 
                 postal_code, role
      `;
      
      const values = [
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.phoneNumber,
        userData.password,
        userData.isVerified || false,
        userData.address || null,
        userData.city || null,
        userData.province || null,
        userData.postalCode || null,
        userData.role || 'user'
      ];
      
      const result = await pool.query(query, values);
      
      // Convert database column names to camelCase for our API
      const user = result.rows[0];
      return {
        id: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phoneNumber: user.phone_number,
        isVerified: user.is_verified,
        createdAt: user.created_at.toISOString(),
        address: user.address,
        city: user.city,
        province: user.province,
        postalCode: user.postal_code,
        role: user.role
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async getUser(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      return {
        id: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phoneNumber: user.phone_number,
        password: user.password,
        isVerified: user.is_verified,
        createdAt: user.created_at.toISOString(),
        address: user.address,
        city: user.city,
        province: user.province,
        postalCode: user.postal_code,
        role: user.role
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }
  
  async getUserByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      return {
        id: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phoneNumber: user.phone_number,
        password: user.password,
        isVerified: user.is_verified,
        createdAt: user.created_at.toISOString(),
        address: user.address,
        city: user.city,
        province: user.province,
        postalCode: user.postal_code,
        role: user.role
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }
  
  // Add other methods here...
}

// In-memory storage implementation
class MemStorage {
  constructor() {
    this.users = [];
    this.beneficiaries = [];
    this.transactions = [];
    this.resetTokens = [];
    this.sessionStore = new memorystore(session)({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Seed test data
    this.seedTestData();
  }
  
  seedTestData() {
    // Add regular test user
    this.users.push({
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'user@example.com',
      // Password: 'user123'
      password: '04cb677ba40479917064f7cb92c12ee47e1cc48c5c349ebff106c6133a42619052a4258c3225e5abf662d6888b366a0f647ade9df59635b82bd0b0a97f314e17.29eeec87b99e20ae',
      phoneNumber: '+14165550123',
      isVerified: true,
      createdAt: new Date().toISOString(),
      role: 'user',
    });
    
    // Add admin user
    this.users.push({
      id: '2',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      // Password: 'admin123'
      password: '04cb677ba40479917064f7cb92c12ee47e1cc48c5c349ebff106c6133a42619052a4258c3225e5abf662d6888b366a0f647ade9df59635b82bd0b0a97f314e17.29eeec87b99e20ae',
      phoneNumber: '+14165559876',
      isVerified: true,
      createdAt: new Date().toISOString(),
      role: 'admin',
    });
    
    // Add a test beneficiary
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
    
    // Add a test transaction
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
    
    console.log('Test data seeded with', this.users.length, 'users,', 
                this.beneficiaries.length, 'beneficiary, and',
                this.transactions.length, 'transaction');
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
  
  // ... (other methods from the original MemStorage)
}

// Choose storage implementation based on database availability
const storage = hasDbCredentials ? new DbStorage() : new MemStorage();

// Report on storage type
if (hasDbCredentials) {
  console.log('Database credentials detected. Using PostgreSQL database.');
} else {
  console.log('Database credentials detected. In a production app, we would connect to PostgreSQL.');
  console.log('For development, we will use in-memory storage for now.');
}

// Import OpenAI service
const openaiService = require('./services/openaiService');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.static('public')); // Serve static files from the 'public' directory

// Session and authentication setup
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
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
    return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

// Admin middleware to check if user is an admin
function isAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
}

// Set up session
app.use(session({
  secret: process.env.SESSION_SECRET || 'sendafrika-secret-key',
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
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
  // Remove password from response
  const { password, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  
  // Get the replit domain for the output message
  const replitDomain = process.env.REPLIT_DOMAIN || 'localhost:5000';
  console.log(`Access the application at: https://${replitDomain}`);
});