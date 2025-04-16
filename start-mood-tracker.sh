#!/bin/bash
# Start script for the Money Mood Tracker server

echo "Starting Money Mood Tracker server on port 5000..."

# Install the minimal required modules
npm install --no-save memorystore express-session uuid --silent

# Use PostgreSQL or in-memory storage based on environment variable
if [ -n "$DATABASE_URL" ]; then
  echo "Database URL available: true"
fi

# Start the server
echo "Money Mood Tracker server running on http://0.0.0.0:5000"
node server.js