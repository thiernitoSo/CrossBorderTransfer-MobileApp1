/**
 * PostgreSQL session store adapter for Express sessions
 * A simplified implementation that works with our PostgreSQL adapter
 */

// Try to load required modules
let session;
try {
  session = require('express-session');
} catch (error) {
  console.error('Express session module not available');
  // Will throw an error when trying to use this module
}

class PostgresSessionStore extends session.Store {
  constructor(options = {}) {
    super(options);
    this.pool = options.pool;
    this.tableName = options.tableName || '"session"';
    this.createTableIfMissing = options.createTableIfMissing || false;
    
    if (this.createTableIfMissing) {
      this._createTableIfNeeded();
    }
  }
  
  async _createTableIfNeeded() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        )
      `);
      console.log('Session table initialized');
    } catch (error) {
      console.error('Error creating session table:', error);
    }
  }
  
  get(sid, callback) {
    this.pool.query(
      `SELECT sess FROM ${this.tableName} WHERE sid = $1 AND expire >= NOW()`,
      [sid],
      (err, result) => {
        if (err) return callback(err);
        
        if (result.rows.length === 0) {
          return callback(null, null);
        }
        
        let sess;
        try {
          sess = result.rows[0].sess;
        } catch (e) {
          return callback(e);
        }
        
        return callback(null, sess);
      }
    );
  }
  
  set(sid, sess, callback) {
    const maxAge = sess.cookie && sess.cookie.maxAge ? sess.cookie.maxAge : 86400000;
    const expiry = new Date(Date.now() + maxAge);
    
    this.pool.query(
      `INSERT INTO ${this.tableName} (sid, sess, expire) 
       VALUES ($1, $2, $3)
       ON CONFLICT (sid) DO UPDATE
       SET sess = $2, expire = $3`,
      [sid, sess, expiry],
      (err) => {
        callback(err);
      }
    );
  }
  
  destroy(sid, callback) {
    this.pool.query(`DELETE FROM ${this.tableName} WHERE sid = $1`, [sid], (err) => {
      callback(err);
    });
  }
  
  touch(sid, sess, callback) {
    const maxAge = sess.cookie && sess.cookie.maxAge ? sess.cookie.maxAge : 86400000;
    const expiry = new Date(Date.now() + maxAge);
    
    this.pool.query(
      `UPDATE ${this.tableName} SET expire = $2 WHERE sid = $1`,
      [sid, expiry],
      (err) => {
        callback(err);
      }
    );
  }
  
  clear(callback) {
    this.pool.query(`DELETE FROM ${this.tableName}`, (err) => {
      callback(err);
    });
  }
  
  length(callback) {
    this.pool.query(`SELECT COUNT(*) AS count FROM ${this.tableName}`, (err, result) => {
      if (err) return callback(err);
      callback(null, result.rows[0].count);
    });
  }
}

module.exports = PostgresSessionStore;