#!/bin/bash

# Flag to determine whether to attempt PostgreSQL connection
USE_POSTGRES=${USE_POSTGRES:-true}
PORT=${PORT:-5001} # Use port 5001 by default, to avoid conflict with Money Mood Tracker

# Check if PostgreSQL packages are installed
if [ "$USE_POSTGRES" = true ]; then
  echo "Attempting to use PostgreSQL database..."
  
  # Try to install PostgreSQL client if needed (non-blocking)
  if ! npm list pg &>/dev/null; then
    echo "PostgreSQL client not found, attempting to install..."
    npm install --no-save pg connect-pg-simple --legacy-peer-deps &>/dev/null || echo "Warning: Could not install PostgreSQL dependencies. Will fall back to in-memory storage."
  fi
else
  echo "Running with in-memory storage only..."
fi

# Export port for the server to use
export PORT

# Start the server
echo "Starting SendAfrika app on port $PORT..."
node server.js