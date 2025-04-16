// Script to initialize/push database schema using drizzle-kit

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if drizzle-kit is installed
try {
  require.resolve('drizzle-kit');
  console.log('drizzle-kit is installed');
} catch (e) {
  console.log('Installing drizzle-kit...');
  execSync('npm install -g drizzle-kit', { stdio: 'inherit' });
}

// Create drizzle.config.ts if it doesn't exist
const drizzleConfigPath = path.join(__dirname, 'drizzle.config.ts');
if (!fs.existsSync(drizzleConfigPath)) {
  console.log('Creating drizzle.config.ts...');
  fs.writeFileSync(
    drizzleConfigPath,
    `import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL
  }
} satisfies Config;
`
  );
}

// Run the push command
console.log('Pushing schema to database...');
try {
  execSync('drizzle-kit push:pg', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL
    }
  });
  console.log('Schema pushed successfully!');
} catch (error) {
  console.error('Error pushing schema:', error.message);
  process.exit(1);
}