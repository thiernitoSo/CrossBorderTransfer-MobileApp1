const { Pool, neonConfig } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const ws = require('ws');

// Load environment variables
dotenv.config();

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set!');
  process.exit(1);
}

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to query the database
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Test the connection
async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('PostgreSQL connection successful! Server time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};