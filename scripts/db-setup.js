// Database initialization script
const { Pool } = require('pg');
require('dotenv').config();

// Define the database schema
const createTablesQuery = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  password TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  address VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user'
);

-- Beneficiaries table
CREATE TABLE IF NOT EXISTS beneficiaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  country VARCHAR(2) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  account_number VARCHAR(50),
  bank_name VARCHAR(100),
  branch_code VARCHAR(50),
  mobile_money_provider VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  source_amount INTEGER NOT NULL,
  source_currency VARCHAR(3) NOT NULL,
  destination_amount INTEGER NOT NULL,
  destination_currency VARCHAR(3) NOT NULL,
  exchange_rate INTEGER NOT NULL,
  fee INTEGER NOT NULL,
  beneficiary_id INTEGER REFERENCES beneficiaries(id),
  beneficiary_name VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  status_message TEXT,
  payment_method VARCHAR(50) NOT NULL,
  provider VARCHAR(50),
  reference VARCHAR(100) NOT NULL,
  external_transaction_id VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Mood entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  transaction_id INTEGER REFERENCES transactions(id),
  mood_id VARCHAR(50) NOT NULL,
  intensity INTEGER DEFAULT 3,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Seed basic mood data
INSERT INTO users (first_name, last_name, email, phone_number, password, is_verified, role)
VALUES ('Test', 'User', 'test@example.com', '+15555555555', 'password_hash', TRUE, 'user')
ON CONFLICT (email) DO NOTHING;
`;

async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true
    }
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Creating tables...');
    await client.query(createTablesQuery);
    
    console.log('Database setup complete!');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      ORDER BY table_name;
    `);
    
    console.log('Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    client.release();
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

// Run the initialization
initializeDatabase();