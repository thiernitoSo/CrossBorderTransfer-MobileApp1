// First try to safely import pg without failing if not available
let pg;
let pool = null;

// Load environment variables
try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch (error) {
  console.warn('dotenv not available, skipping environment variable loading');
}

// Safe import of pg
try {
  pg = require('pg');
} catch (error) {
  console.warn('pg module not available');
}

// Helper function to check if DATABASE_URL exists
function hasDatabaseUrl() {
  return !!process.env.DATABASE_URL;
}

// Create pool if pg is available and DATABASE_URL exists
if (pg && hasDatabaseUrl()) {
  try {
    const { Pool } = pg;
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for some PostgreSQL services like Neon
      }
    });
    console.log('PostgreSQL pool initialized');
  } catch (error) {
    console.error('Failed to initialize PostgreSQL pool:', error.message);
  }
}

// Test the connection
async function testConnection() {
  if (!pool) {
    console.error('No PostgreSQL pool available to test');
    return false;
  }
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('PostgreSQL connection successful! Server time:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
    return false;
  }
}

module.exports = { 
  pool, 
  testConnection,
  hasDatabaseUrl
};