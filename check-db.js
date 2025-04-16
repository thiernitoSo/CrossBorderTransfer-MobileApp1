/**
 * Database connectivity check utility
 * This script attempts to connect to the PostgreSQL database
 * and reports the connection status
 */

// Optional loading of dotenv for local testing
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using environment variables');
}

console.log('Database connection check utility');
console.log('----------------------------------');

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL environment variable not found');
  console.log('   Set this variable to connect to PostgreSQL');
  process.exit(1);
}

console.log('✅ DATABASE_URL environment variable found');

// Try to load pg module
let pg;
try {
  pg = require('pg');
  console.log('✅ PostgreSQL client module loaded successfully');
} catch (err) {
  console.log(`❌ Could not load PostgreSQL client module: ${err.message}`);
  console.log('   Try running: npm install pg');
  process.exit(1);
}

// Attempt connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('Attempting database connection...');

pool.connect()
  .then(client => {
    console.log('✅ Successfully connected to the database');
    
    // Test query
    return client.query('SELECT NOW() as time')
      .then(res => {
        console.log(`✅ Database query successful. Server time: ${res.rows[0].time}`);
        client.release();
        pool.end();
      });
  })
  .catch(err => {
    console.log(`❌ Database connection error: ${err.message}`);
    process.exit(1);
  });