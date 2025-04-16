const memorystore = require('memorystore');
const session = require('express-session');

// Create a MemoryStore for session storage
const MemoryStore = memorystore(session);

// Create a session store instance
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // Prune expired entries every 24h
});

// Simple function to check if we have database credentials
function hasDatabaseCredentials() {
  return !!process.env.DATABASE_URL;
}

// Let's log the database connection status
if (hasDatabaseCredentials()) {
  console.log('Database credentials detected. In a production app, we would connect to PostgreSQL.');
  console.log('For development, we will use in-memory storage for now.');
} else {
  console.log('No database credentials found. Using in-memory storage.');
}

module.exports = {
  sessionStore,
  hasDatabaseCredentials
};