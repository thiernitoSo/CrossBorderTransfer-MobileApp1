const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Create a PostgreSQL client
let pool;
let isPostgresConnected = false;

// Initialize the DB connection
async function initializeDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('No DATABASE_URL found. Using in-memory storage.');
    return false;
  }

  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false // Required for some PostgreSQL providers
      }
    });

    // Test the connection
    await pool.query('SELECT NOW()');
    console.log('Successfully connected to PostgreSQL database.');
    isPostgresConnected = true;
    
    // Create tables if they don't exist
    await createTables();
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    isPostgresConnected = false;
    return false;
  }
}

// Create required database tables
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
    
    console.log('Database tables created or verified successfully');
    
    // Check if we have any users
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    
    // If no users exist, add test users
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('No users found in database. Creating test users...');
      await seedTestData();
    }
  } catch (error) {
    console.error('Error creating database tables:', error);
  }
}

// Add some test data to the database
async function seedTestData() {
  try {
    // Add user
    await pool.query(`
      INSERT INTO users (
        first_name, last_name, email, phone_number, password, is_verified, role
      ) VALUES (
        'User', 'Test', 'user@example.com', '+14165550123', 
        '04cb677ba40479917064f7cb92c12ee47e1cc48c5c349ebff106c6133a42619052a4258c3225e5abf662d6888b366a0f647ade9df59635b82bd0b0a97f314e17.29eeec87b99e20ae', 
        TRUE, 'user'
      )
    `);
    
    // Add admin
    await pool.query(`
      INSERT INTO users (
        first_name, last_name, email, phone_number, password, is_verified, role
      ) VALUES (
        'Admin', 'User', 'admin@example.com', '+14165559876', 
        '04cb677ba40479917064f7cb92c12ee47e1cc48c5c349ebff106c6133a42619052a4258c3225e5abf662d6888b366a0f647ade9df59635b82bd0b0a97f314e17.29eeec87b99e20ae', 
        TRUE, 'admin'
      )
    `);
    
    console.log('Test users created successfully');
  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}

// User methods
async function getUserByEmail(email) {
  if (!isPostgresConnected) return null;
  
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
    return null;
  }
}

async function getUser(id) {
  if (!isPostgresConnected) return null;
  
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
    console.error('Error getting user by ID:', error);
    return null;
  }
}

async function createUser(userData) {
  if (!isPostgresConnected) return null;
  
  try {
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

module.exports = {
  initializeDatabase,
  isConnected: () => isPostgresConnected,
  getUserByEmail,
  getUser,
  createUser
};