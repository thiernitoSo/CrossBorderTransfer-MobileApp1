/**
 * Database connection module for SendAfrika
 * Supports both Neon PostgreSQL and regular PostgreSQL databases
 * Gracefully handles missing modules
 */

// Define types for export
export let pool: any = null;
export let db: any = null;

// Attempt to initialize database connection
try {
  // First attempt with @neondatabase/serverless
  try {
    const { Pool, neonConfig } = require('@neondatabase/serverless');
    const { drizzle } = require('drizzle-orm/neon-serverless');
    const ws = require('ws');
    const schema = require('@shared/schema');

    neonConfig.webSocketConstructor = ws;

    if (process.env.DATABASE_URL) {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      db = drizzle({ client: pool, schema });
      console.log('Connected to Neon PostgreSQL database');
    }
  } catch (neonError) {
    console.log('Neon PostgreSQL client not available:', neonError.message);
    
    // Try regular PostgreSQL
    try {
      const { Pool } = require('pg');
      const { drizzle } = require('drizzle-orm/pg-core');
      const schema = require('@shared/schema');

      if (process.env.DATABASE_URL) {
        pool = new Pool({ 
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        db = drizzle({ client: pool, schema });
        console.log('Connected to PostgreSQL database');
      }
    } catch (pgError) {
      console.log('PostgreSQL client not available:', pgError.message);
    }
  }
} catch (error) {
  console.log('Database module initialization failed:', error.message);
}

// Check if database is connected
export const isDatabaseConnected = () => !!pool;
