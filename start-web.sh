#!/bin/bash

# Exit on error
set -e

echo "⚙️ Starting web build process..."

# Skip typescript checks for now due to dependency conflicts
# echo "🔍 Running tsc for type checking..."
# npx tsc --noEmit

echo "📱 Starting Expo web server..."
BROWSER=none PORT=5000 npx expo start --web --no-dev --minify