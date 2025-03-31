import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import TabBar from '../../components/ui/TabBar';

/**
 * This layout is used for the authenticated routes.
 * If the user is not authenticated, they will be redirected to the auth page.
 */
export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // While loading, show nothing to avoid flash of content
  if (isLoading) {
    return null;
  }

  // If not authenticated, redirect to auth page
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/auth" />;
  }

  return (
    <View style={styles.container}>
      <Stack screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="send-money" />
        <Stack.Screen name="beneficiaries" />
        <Stack.Screen name="transactions" />
        <Stack.Screen name="profile" />
      </Stack>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});