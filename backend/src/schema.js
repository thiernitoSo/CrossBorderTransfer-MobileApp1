const { pool } = require('./db');

// Define schema and tables
const schema = {
  // Users table
  createUsersTable: `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone_number VARCHAR(20),
      password VARCHAR(255) NOT NULL,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      address VARCHAR(255),
      city VARCHAR(100),
      province VARCHAR(100),
      postal_code VARCHAR(20),
      role VARCHAR(20) DEFAULT 'user'
    )
  `,

  // Beneficiaries table
  createBeneficiariesTable: `
    CREATE TABLE IF NOT EXISTS beneficiaries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      country VARCHAR(3) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      relationship VARCHAR(50) NOT NULL,
      payment_method VARCHAR(20) NOT NULL,
      account_number VARCHAR(50),
      bank_name VARCHAR(100),
      branch_code VARCHAR(50),
      mobile_money_provider VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Transactions table
  createTransactionsTable: `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_amount DECIMAL(14, 2) NOT NULL,
      source_currency VARCHAR(3) NOT NULL,
      destination_amount DECIMAL(14, 2) NOT NULL,
      destination_currency VARCHAR(3) NOT NULL,
      exchange_rate DECIMAL(14, 6) NOT NULL,
      fee DECIMAL(14, 2) NOT NULL,
      beneficiary_id INTEGER NOT NULL REFERENCES beneficiaries(id),
      beneficiary_name VARCHAR(201) NOT NULL, 
      status VARCHAR(20) NOT NULL,
      status_message TEXT,
      payment_method VARCHAR(50) NOT NULL,
      provider VARCHAR(50),
      reference VARCHAR(100) NOT NULL,
      external_transaction_id VARCHAR(100),
      note TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Reset tokens table
  createResetTokensTable: `
    CREATE TABLE IF NOT EXISTS reset_tokens (
      token VARCHAR(255) PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL
    )
  `,

  // Sessions table (used by connect-pg-simple)
  createSessionsTable: `
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    )
  `
};

// Function to create all tables
async function initializeTables() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('Creating users table...');
    await client.query(schema.createUsersTable);
    
    console.log('Creating beneficiaries table...');
    await client.query(schema.createBeneficiariesTable);
    
    console.log('Creating transactions table...');
    await client.query(schema.createTransactionsTable);
    
    console.log('Creating reset tokens table...');
    await client.query(schema.createResetTokensTable);
    
    console.log('Creating sessions table...');
    await client.query(schema.createSessionsTable);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('All tables created successfully');
    return true;
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    return false;
  } finally {
    client.release();
  }
}

module.exports = {
  schema,
  initializeTables
};