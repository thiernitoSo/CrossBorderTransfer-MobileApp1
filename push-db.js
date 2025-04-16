// This script manually pushes the Drizzle schema to the PostgreSQL database
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create drizzle directory if it doesn't exist
const drizzleDir = path.join(__dirname, 'drizzle');
if (!fs.existsSync(drizzleDir)) {
  fs.mkdirSync(drizzleDir);
}

// Create a temporary config file
const configPath = path.join(__dirname, 'drizzle.config.js');
const configContent = `
module.exports = {
  schema: './shared/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
};
`;

fs.writeFileSync(configPath, configContent);

try {
  console.log('Pushing schema to PostgreSQL database...');
  // Use npx to run drizzle-kit
  execSync('npx drizzle-kit push:pg', { stdio: 'inherit' });
  console.log('Schema successfully pushed to database!');
} catch (error) {
  console.error('Error pushing schema to database:', error);
  process.exit(1);
} finally {
  // Clean up the temporary config file
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}