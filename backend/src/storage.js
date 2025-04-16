const { v4: uuidv4 } = require('uuid');
const { pool, query } = require('./db');
const connectPgSimple = require('connect-pg-simple');
const session = require('express-session');

// Create a PostgreSQL session store
const PostgresStore = connectPgSimple(session);

class PostgresStorage {
  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async createUser(userData) {
    const { firstName, lastName, email, password, phoneNumber, isVerified, address, city, province, postalCode, role } = userData;
    
    const result = await query(
      `INSERT INTO users 
        (first_name, last_name, email, password, phone_number, is_verified, address, city, province, postal_code, role) 
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [firstName, lastName, email, password, phoneNumber, isVerified || false, address, city, province, postalCode, role || 'user']
    );
    
    return this.mapUserFromDatabase(result.rows[0]);
  }

  async getUser(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapUserFromDatabase(result.rows[0]);
  }

  async getUserByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return null;
    return this.mapUserFromDatabase(result.rows[0]);
  }

  async updateUser(id, userData) {
    const fields = [];
    const values = [];
    const params = [];
    let paramIndex = 1;

    // Dynamically build the SET clause
    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined) {
        const dbKey = this.camelToSnakeCase(key);
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(...values, id);
    
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return this.mapUserFromDatabase(result.rows[0]);
  }

  async deleteUser(id) {
    await query('DELETE FROM users WHERE id = $1', [id]);
  }
  
  async getAllUsers(page, limit) {
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    return result.rows.map(row => this.mapUserFromDatabase(row));
  }
  
  async countUsers() {
    const result = await query('SELECT COUNT(*) as count FROM users');
    return parseInt(result.rows[0].count);
  }

  // Beneficiary methods
  async createBeneficiary(data) {
    const { 
      userId, firstName, lastName, country, phoneNumber, relationship, 
      paymentMethod, accountNumber, bankName, branchCode, mobileMoneyProvider 
    } = data;
    
    const result = await query(
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
    
    return this.mapBeneficiaryFromDatabase(result.rows[0]);
  }

  async getBeneficiary(id) {
    const result = await query('SELECT * FROM beneficiaries WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapBeneficiaryFromDatabase(result.rows[0]);
  }

  async updateBeneficiary(id, data) {
    const fields = [];
    const values = [];
    const params = [];
    let paramIndex = 1;

    // Dynamically build the SET clause
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const dbKey = this.camelToSnakeCase(key);
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(...values, id);
    
    const result = await query(
      `UPDATE beneficiaries SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      throw new Error('Beneficiary not found');
    }
    
    return this.mapBeneficiaryFromDatabase(result.rows[0]);
  }

  async deleteBeneficiary(id) {
    await query('DELETE FROM beneficiaries WHERE id = $1', [id]);
  }

  async getBeneficiariesByUserId(userId) {
    const result = await query(
      'SELECT * FROM beneficiaries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows.map(row => this.mapBeneficiaryFromDatabase(row));
  }
  
  async getAllBeneficiaries(page, limit) {
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT * FROM beneficiaries ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    return result.rows.map(row => this.mapBeneficiaryFromDatabase(row));
  }
  
  async countBeneficiaries() {
    const result = await query('SELECT COUNT(*) as count FROM beneficiaries');
    return parseInt(result.rows[0].count);
  }

  // Transaction methods
  async createTransaction(data) {
    const {
      userId, sourceAmount, sourceCurrency, destinationAmount, destinationCurrency,
      exchangeRate, fee, beneficiaryId, beneficiaryName, status, statusMessage,
      paymentMethod, provider, note
    } = data;
    
    // Generate a unique reference number
    const reference = uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase();
    
    const result = await query(
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
    
    return this.mapTransactionFromDatabase(result.rows[0]);
  }

  async getTransaction(id) {
    const result = await query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapTransactionFromDatabase(result.rows[0]);
  }

  async updateTransaction(id, data) {
    const fields = [];
    const values = [];
    const params = [];
    let paramIndex = 1;

    // Dynamically build the SET clause
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const dbKey = this.camelToSnakeCase(key);
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(...values, id);
    
    const result = await query(
      `UPDATE transactions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      throw new Error('Transaction not found');
    }
    
    return this.mapTransactionFromDatabase(result.rows[0]);
  }

  async getTransactionsByUserId(userId, page, limit) {
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    
    return result.rows.map(row => this.mapTransactionFromDatabase(row));
  }

  async countTransactionsByUserId(userId) {
    const result = await query('SELECT COUNT(*) as count FROM transactions WHERE user_id = $1', [userId]);
    return parseInt(result.rows[0].count);
  }
  
  async getAllTransactions(page, limit, filters) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (filters?.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters?.country) {
      // This requires a join with beneficiaries
      conditions.push(`EXISTS (SELECT 1 FROM beneficiaries b WHERE b.id = transactions.beneficiary_id AND b.country = $${paramIndex})`);
      params.push(filters.country);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    
    const result = await query(
      `SELECT * FROM transactions ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );
    
    return result.rows.map(row => this.mapTransactionFromDatabase(row));
  }
  
  async countAllTransactions(filters) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (filters?.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters?.country) {
      // This requires a join with beneficiaries
      conditions.push(`EXISTS (SELECT 1 FROM beneficiaries b WHERE b.id = transactions.beneficiary_id AND b.country = $${paramIndex})`);
      params.push(filters.country);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const result = await query(`SELECT COUNT(*) as count FROM transactions ${whereClause}`, params);
    return parseInt(result.rows[0].count);
  }

  async getTransactionStatistics() {
    // Total counts by status
    const countResult = await query(`
      SELECT
        COUNT(*) as total_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_count,
        SUM(CASE WHEN source_currency = 'CAD' THEN source_amount ELSE 0 END) as total_amount_cad
      FROM transactions
    `);
    
    // Currency distribution
    const currencyResult = await query(`
      SELECT 
        destination_currency as currency,
        COUNT(*) as count,
        SUM(destination_amount) as amount
      FROM transactions
      GROUP BY destination_currency
    `);
    
    // Country distribution - requires join with beneficiaries
    const countryResult = await query(`
      SELECT 
        b.country,
        COUNT(*) as count
      FROM transactions t
      JOIN beneficiaries b ON t.beneficiary_id = b.id
      GROUP BY b.country
    `);
    
    // Transactions by time period
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const timePeriodsResult = await query(`
      SELECT
        COUNT(CASE WHEN created_at >= $1 THEN 1 END) as last_24_hours,
        COUNT(CASE WHEN created_at >= $2 THEN 1 END) as last_7_days,
        COUNT(CASE WHEN created_at >= $3 THEN 1 END) as last_30_days
      FROM transactions
    `, [oneDayAgo.toISOString(), sevenDaysAgo.toISOString(), thirtyDaysAgo.toISOString()]);
    
    // Format currency distribution
    const currencyDistribution = {};
    currencyResult.rows.forEach(row => {
      currencyDistribution[row.currency] = {
        count: parseInt(row.count),
        amount: parseFloat(row.amount)
      };
    });
    
    // Format country distribution
    const countryDistribution = {};
    countryResult.rows.forEach(row => {
      countryDistribution[row.country] = parseInt(row.count);
    });
    
    return {
      totalCount: parseInt(countResult.rows[0].total_count),
      completedCount: parseInt(countResult.rows[0].completed_count),
      pendingCount: parseInt(countResult.rows[0].pending_count),
      failedCount: parseInt(countResult.rows[0].failed_count),
      cancelledCount: parseInt(countResult.rows[0].cancelled_count),
      processingCount: parseInt(countResult.rows[0].processing_count),
      totalAmountCAD: parseFloat(countResult.rows[0].total_amount_cad) || 0,
      currencyDistribution,
      countryDistribution,
      last24Hours: parseInt(timePeriodsResult.rows[0].last_24_hours),
      last7Days: parseInt(timePeriodsResult.rows[0].last_7_days),
      last30Days: parseInt(timePeriodsResult.rows[0].last_30_days)
    };
  }

  // Password reset methods
  async storeResetToken(userId, token) {
    // First, delete any existing tokens for this user
    await query('DELETE FROM reset_tokens WHERE user_id = $1', [userId]);
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    await query(
      'INSERT INTO reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [token, userId, expiresAt]
    );
  }

  async getUserIdByResetToken(token) {
    // Get token and check expiration
    const result = await query(
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
    await query('DELETE FROM reset_tokens WHERE token = $1', [token]);
  }

  // Helper methods to map database snake_case to camelCase
  mapUserFromDatabase(row) {
    if (!row) return null;
    
    return {
      id: row.id.toString(),
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phoneNumber: row.phone_number,
      password: row.password,
      isVerified: row.is_verified,
      createdAt: row.created_at.toISOString(),
      address: row.address,
      city: row.city,
      province: row.province,
      postalCode: row.postal_code,
      role: row.role
    };
  }

  mapBeneficiaryFromDatabase(row) {
    if (!row) return null;
    
    return {
      id: row.id.toString(),
      userId: row.user_id.toString(),
      firstName: row.first_name,
      lastName: row.last_name,
      country: row.country,
      phoneNumber: row.phone_number,
      relationship: row.relationship,
      paymentMethod: row.payment_method,
      accountNumber: row.account_number,
      bankName: row.bank_name,
      branchCode: row.branch_code,
      mobileMoneyProvider: row.mobile_money_provider,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  mapTransactionFromDatabase(row) {
    if (!row) return null;
    
    return {
      id: row.id.toString(),
      userId: row.user_id.toString(),
      sourceAmount: parseFloat(row.source_amount),
      sourceCurrency: row.source_currency,
      destinationAmount: parseFloat(row.destination_amount),
      destinationCurrency: row.destination_currency,
      exchangeRate: parseFloat(row.exchange_rate),
      fee: parseFloat(row.fee),
      beneficiaryId: row.beneficiary_id.toString(),
      beneficiaryName: row.beneficiary_name,
      status: row.status,
      statusMessage: row.status_message,
      paymentMethod: row.payment_method,
      provider: row.provider,
      reference: row.reference,
      externalTransactionId: row.external_transaction_id,
      note: row.note,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  }

  // Helper method to convert camelCase to snake_case
  camelToSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = {
  storage: new PostgresStorage()
};