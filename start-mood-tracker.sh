#!/bin/bash
# Start script for the Money Mood Tracker server

echo "Starting Money Mood Tracker server on port 5000..."

# Check if database URL is available
if [ -n "$DATABASE_URL" ]; then
  echo "Database URL available: true"
  
  # Install required modules silently
  npm install --no-save memorystore express-session uuid --silent
else
  echo "WARNING: DATABASE_URL not found. Using in-memory storage instead."
  
  # Install the minimal modules needed for in-memory storage
  npm install --no-save memorystore express-session uuid --silent
fi

# Start the server
echo "Money Mood Tracker server running on http://0.0.0.0:5000"
node server.js