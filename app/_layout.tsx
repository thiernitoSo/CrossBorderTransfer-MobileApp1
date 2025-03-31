import React, { useEffect } from 'react';
import { StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import theme, { theme as paperTheme } from '../constants/theme';

/**
 * Root layout for the entire application.
 * Sets up providers and global navigation structure.
 */
export default function RootLayout() {
  useEffect(() => {
    // Initialization logic can go here
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <RNStatusBar barStyle="dark-content" />
          <Stack screenOptions={{ 
            headerShown: false,
            animation: 'fade',
          }}>
            {/* Entry point */}
            <Stack.Screen name="index" />
            
            {/* Auth group - redirects to dashboard if already logged in */}
            <Stack.Screen 
              name="(auth)" 
              options={{ 
                gestureEnabled: false,
              }} 
            />
            
            {/* Authenticated group - redirects to auth if not logged in */}
            <Stack.Screen 
              name="(authenticated)" 
              options={{ 
                gestureEnabled: false,
              }} 
            />
            
            {/* Support page is available to all users */}
            <Stack.Screen 
              name="support" 
              options={{ 
                gestureEnabled: true,
                presentation: 'modal',
              }} 
            />
          </Stack>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
