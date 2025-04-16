const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the package.json file
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add the dependencies
const newDependencies = {
  "pg": "^8.11.3",
  "drizzle-orm": "^0.30.5",
  "@neondatabase/serverless": "^0.9.0",
  "connect-pg-simple": "^9.0.1",
  "ws": "^8.16.0"
};

// Update the dependencies in the packageJson
packageJson.dependencies = {
  ...packageJson.dependencies,
  ...newDependencies
};

// Write the updated packageJson back to the file
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Package.json updated successfully!');