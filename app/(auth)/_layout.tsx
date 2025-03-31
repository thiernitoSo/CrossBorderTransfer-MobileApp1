import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

/**
 * This layout is used for authentication related routes.
 * If the user is already authenticated, they will be redirected to the dashboard.
 */
export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // While loading, show nothing to avoid flash of content
  if (isLoading) {
    return null;
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Redirect href="/(authenticated)/dashboard" />;
  }

  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'fade',
    }}>
      <Stack.Screen name="auth" />
    </Stack>
  );
}