#!/bin/bash

echo "Starting SendAfrika API server..."

# Load environment variables from .env
if [ -f .env ]; then
  echo "Loading environment variables from .env"
  export $(cat .env | grep -v '^#' | xargs)
fi

# Start the server
node server.js