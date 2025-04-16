/**
 * PostgreSQL adapter for SendAfrika
 * Implements a simplified interface for database operations
 * without requiring external ORM dependencies
 */

// Check if pg module is available
let Pool;
let pool = null;
let pgAvailable = false;

try {
  const pg = require('pg');
  Pool = pg.Pool;
  pgAvailable = true;
  console.log("PostgreSQL module found");
} catch (error) {
  console.log("PostgreSQL module not available, will use in-memory storage");
}

// Initialize PostgreSQL connection
async function initializePostgres() {
  // Check if pg module is available
  if (!pgAvailable) {
    return { success: false, message: 'PostgreSQL module not available' };
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return { success: false, message: 'DATABASE_URL not found' };
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Test connection
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      console.log('PostgreSQL connected successfully!', result.rows[0].now);
      return { success: true };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
    return { success: false, message: error.message };
  }
}

// Ensure database tables exist
async function ensureTablesExist() {
  if (!pool) {
    return { success: false, message: 'PostgreSQL not initialized' };
  }
  
  const client = await pool.connect();
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        address VARCHAR(255),
        city VARCHAR(100),
        province VARCHAR(100),
        postal_code VARCHAR(20),
        role VARCHAR(20) DEFAULT 'user'
      )
    `);
    
    // Create beneficiaries table
    await client.query(`
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
    `);
    
    // Create transactions table
    await client.query(`
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
    `);
    
    // Create reset tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create sessions table (for connect-pg-simple)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('PostgreSQL tables created successfully!');
    return { success: true };
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error creating PostgreSQL tables:', error.message);
    return { success: false, message: error.message };
  } finally {
    client.release();
  }
}

// PostgreSQL storage adapter implementation
class PostgresAdapter {
  constructor() {
    this.pool = pool;
  }
  
  // User methods
  async createUser(userData) {
    const { firstName, lastName, email, password, phoneNumber, isVerified, address, city, province, postalCode, role } = userData;
    
    const result = await pool.query(
      `INSERT INTO users 
        (first_name, last_name, email, password, phone_number, is_verified, address, city, province, postal_code, role) 
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [firstName, lastName, email, password, phoneNumber, isVerified || false, address, city, province, postalCode, role || 'user']
    );
    
    return this._mapUserFromDatabase(result.rows[0]);
  }
  
  async getUser(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this._mapUserFromDatabase(result.rows[0]);
  }
  
  async getUserByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return null;
    return this._mapUserFromDatabase(result.rows[0]);
  }
  
  async updateUser(id, userData) {
    // Build dynamic SET clause and parameters
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined) {
        const dbKey = this._camelToSnakeCase(key);
        updates.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Add updated_at
    updates.push(`updated_at = NOW()`);
    
    // Add id as the last parameter
    values.push(id);
    
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return this._mapUserFromDatabase(result.rows[0]);
  }
  
  async deleteUser(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
  
  // Beneficiary methods
  async createBeneficiary(data) {
    const { 
      userId, firstName, lastName, country, phoneNumber, relationship, 
      paymentMethod, accountNumber, bankName, branchCode, mobileMoneyProvider 
    } = data;
    
    const result = await pool.query(
      `INSERT INTO beneficiaries
        (user_id, first_name, last_name, country, phone_number, relationship, 
        payment_method, account_number, bank_name, branch_code, mobile_money_provider)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId, firstName, lastName, country, phoneNumber, relationship,
        paymentMethod, accountNumber, bankName, branchCode, mobileMoneyProvider
      ]
    );
    
    return this._mapBeneficiaryFromDatabase(result.rows[0]);
  }
  
  async getBeneficiary(id) {
    const result = await pool.query('SELECT * FROM beneficiaries WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this._mapBeneficiaryFromDatabase(result.rows[0]);
  }
  
  async updateBeneficiary(id, data) {
    // Build dynamic SET clause and parameters
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const dbKey = this._camelToSnakeCase(key);
        updates.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Add updated_at
    updates.push(`updated_at = NOW()`);
    
    // Add id as the last parameter
    values.push(id);
    
    const result = await pool.query(
      `UPDATE beneficiaries SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      throw new Error('Beneficiary not found');
    }
    
    return this._mapBeneficiaryFromDatabase(result.rows[0]);
  }
  
  async deleteBeneficiary(id) {
    await pool.query('DELETE FROM beneficiaries WHERE id = $1', [id]);
  }
  
  async getBeneficiariesByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM beneficiaries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows.map(row => this._mapBeneficiaryFromDatabase(row));
  }
  
  // Transaction methods
  async createTransaction(data) {
    const {
      userId, sourceAmount, sourceCurrency, destinationAmount, destinationCurrency,
      exchangeRate, fee, beneficiaryId, beneficiaryName, status, statusMessage,
      paymentMethod, provider, reference, note
    } = data;
    
    const result = await pool.query(
      `INSERT INTO transactions
        (user_id, source_amount, source_currency, destination_amount, destination_currency,
        exchange_rate, fee, beneficiary_id, beneficiary_name, status, status_message,
        payment_method, provider, reference, note)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        userId, sourceAmount, sourceCurrency, destinationAmount, destinationCurrency,
        exchangeRate, fee, beneficiaryId, beneficiaryName, status || 'pending', statusMessage,
        paymentMethod, provider, reference, note
      ]
    );
    
    return this._mapTransactionFromDatabase(result.rows[0]);
  }
  
  async getTransaction(id) {
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this._mapTransactionFromDatabase(result.rows[0]);
  }
  
  async updateTransaction(id, data) {
    // Build dynamic SET clause and parameters
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const dbKey = this._camelToSnakeCase(key);
        updates.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Add updated_at
    updates.push(`updated_at = NOW()`);
    
    // Add id as the last parameter
    values.push(id);
    
    const result = await pool.query(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      throw new Error('Transaction not found');
    }
    
    return this._mapTransactionFromDatabase(result.rows[0]);
  }
  
  async getTransactionsByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    
    return result.rows.map(row => this._mapTransactionFromDatabase(row));
  }
  
  async countTransactionsByUserId(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = $1',
      [userId]
    );
    
    return parseInt(result.rows[0].count);
  }
  
  // Reset token methods
  async storeResetToken(userId, token) {
    // Delete any existing tokens for this user
    await pool.query('DELETE FROM reset_tokens WHERE user_id = $1', [userId]);
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    await pool.query(
      'INSERT INTO reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );
  }
  
  async getUserIdByResetToken(token) {
    // Get token and check if it's expired
    const result = await pool.query(
      'SELECT user_id, expires_at FROM reset_tokens WHERE token = $1',
      [token]
    );
    
    if (result.rows.length === 0) return null;
    
    const { user_id, expires_at } = result.rows[0];
    
    // Check if token is expired
    if (new Date(expires_at) < new Date()) {
      await this.deleteResetToken(token);
      return null;
    }
    
    return user_id;
  }
  
  async deleteResetToken(token) {
    await pool.query('DELETE FROM reset_tokens WHERE token = $1', [token]);
  }
  
  // Helper methods to map database snake_case to camelCase
  _mapUserFromDatabase(row) {
    if (!row) return null;
    
    // Format timestamps or use current time if null
    const createdAt = row.created_at ? row.created_at.toISOString() : new Date().toISOString();
    const updatedAt = row.updated_at ? row.updated_at.toISOString() : new Date().toISOString();
    
    return {
      id: row.id.toString(),
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      email: row.email || '',
      phoneNumber: row.phone_number || '',
      password: row.password || '',
      isVerified: row.is_verified || false,
      createdAt: createdAt,
      updatedAt: updatedAt,
      address: row.address || '',
      city: row.city || '',
      province: row.province || '',
      postalCode: row.postal_code || '',
      role: row.role || 'user'
    };
  }
  
  _mapBeneficiaryFromDatabase(row) {
    if (!row) return null;
    
    // Format timestamps or use current time if null
    const createdAt = row.created_at ? row.created_at.toISOString() : new Date().toISOString();
    const updatedAt = row.updated_at ? row.updated_at.toISOString() : new Date().toISOString();
    
    return {
      id: row.id.toString(),
      userId: row.user_id.toString(),
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      country: row.country || '',
      phoneNumber: row.phone_number || '',
      relationship: row.relationship || '',
      paymentMethod: row.payment_method || '',
      accountNumber: row.account_number || '',
      bankName: row.bank_name || '',
      branchCode: row.branch_code || '',
      mobileMoneyProvider: row.mobile_money_provider || '',
      createdAt: createdAt,
      updatedAt: updatedAt
    };
  }
  
  _mapTransactionFromDatabase(row) {
    if (!row) return null;
    
    // Format timestamps or use current time if null
    const createdAt = row.created_at ? row.created_at.toISOString() : new Date().toISOString();
    const updatedAt = row.updated_at ? row.updated_at.toISOString() : new Date().toISOString();
    
    return {
      id: row.id.toString(),
      userId: row.user_id.toString(),
      sourceAmount: parseFloat(row.source_amount || '0'),
      sourceCurrency: row.source_currency || 'CAD',
      destinationAmount: parseFloat(row.destination_amount || '0'),
      destinationCurrency: row.destination_currency || '',
      exchangeRate: parseFloat(row.exchange_rate || '1'),
      fee: parseFloat(row.fee || '0'),
      beneficiaryId: row.beneficiary_id ? row.beneficiary_id.toString() : '',
      beneficiaryName: row.beneficiary_name || '',
      status: row.status || 'pending',
      statusMessage: row.status_message || '',
      paymentMethod: row.payment_method || '',
      provider: row.provider || '',
      reference: row.reference || '',
      externalTransactionId: row.external_transaction_id || '',
      note: row.note || '',
      createdAt: createdAt,
      updatedAt: updatedAt
    };
  }
  
  // Helper to convert camelCase to snake_case
  _camelToSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = {
  initializePostgres,
  ensureTablesExist,
  PostgresAdapter
};