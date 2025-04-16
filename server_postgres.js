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

// Load environment variables
dotenv.config();

// Import our database service
const dbService = require('./services/storageService');

// Create Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Import OpenAI service
const openaiService = require('./services/openaiService');

// Create memory store for sessions
const MemoryStore = memorystore(session);
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

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

// Set up session
app.use(session({
  secret: process.env.SESSION_SECRET || 'sendafrika-secret-key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: false, // Set to true in production with HTTPS
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
      const user = await dbService.getUserByEmail(email);
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
    const user = await dbService.getUser(id);
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
    const existingUser = await dbService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create new user
    const hashedPassword = await hashPassword(password);
    const user = await dbService.createUser({
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

// Initialize the database and start the server
async function startServer() {
  console.log('Starting Money Mood Tracker server on port 5000...');
  console.log('Database URL available:', !!process.env.DATABASE_URL);
  
  // Initialize database connection
  const dbConnected = await dbService.initializeDatabase();
  
  if (dbConnected) {
    console.log('Using PostgreSQL database for storage.');
  } else {
    console.log('Using in-memory storage for development.');
  }
  
  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    
    // Get the replit domain for the output message
    const replitDomain = process.env.REPLIT_DOMAIN || 'localhost:5000';
    console.log(`Access the application at: https://${replitDomain}`);
  });
}

// Start the server
startServer();