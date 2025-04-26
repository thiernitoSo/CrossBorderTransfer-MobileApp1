#!/bin/bash

# Stop the mobile app if it's running
echo "Stopping existing Expo instance..."
pkill -f "npx expo start" || true

# Install the correct versions of packages
echo "Installing correct versions of Expo dependencies..."
npx expo install @react-native-async-storage/async-storage@1.18.2 \
  @react-native-community/datetimepicker@7.2.0 \
  expo-image-picker@~14.3.2 \
  expo-router@^2.0.0 \
  expo-secure-store@~12.3.1 \
  react-dom@18.2.0 \
  react-native@0.72.10 \
  react-native-safe-area-context@4.6.3 \
  react-native-screens@~3.22.0 \
  expo-constants@~14.4.2 \
  expo-linking@~5.0.2 \
  expo-status-bar@~1.6.0

echo "Dependencies fixed successfully!"