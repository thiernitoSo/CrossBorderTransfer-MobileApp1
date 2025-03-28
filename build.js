const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Create shared schema definition for compilation
if (!fs.existsSync('shared')) {
  fs.mkdirSync('shared');
}

if (!fs.existsSync('shared/schema.ts')) {
  fs.writeFileSync('shared/schema.ts', `
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  isVerified: boolean;
  createdAt: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}
  `);
}

// Function to recursively copy directory
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Read all files and subdirectories
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyDirectory(sourcePath, destPath);
    } else if (entry.isFile()) {
      // Skip non-TypeScript files
      if (!entry.name.endsWith('.ts')) {
        fs.copyFileSync(sourcePath, destPath);
        continue;
      }

      // Read TypeScript file
      const content = fs.readFileSync(sourcePath, 'utf8');

      // Convert TypeScript to JavaScript
      const jsContent = content
        // Remove type annotations
        .replace(/: [A-Za-z<>|&\[\]]+/g, '')
        // Remove interface declarations
        .replace(/interface [A-Za-z]+ {[\s\S]*?}/g, '')
        // Remove import types
        .replace(/import type.*?;/g, '')
        // Remove type declarations
        .replace(/type [A-Za-z]+ =.*?;/g, '')
        // Fix imports by removing extensions
        .replace(/from ['"](.+)\.ts['"]/g, 'from \'$1\'')
        // Handle @shared imports
        .replace(/from ['"]@shared\/schema['"]/g, 'from \'../shared/schema\'');

      // Save as JavaScript file
      const jsFilePath = destPath.replace('.ts', '.js');
      fs.writeFileSync(jsFilePath, jsContent);
    }
  }
}

// Copy server directory and convert TS to JS
copyDirectory('server', 'dist/server');
copyDirectory('shared', 'dist/shared');

console.log('Build completed successfully!');