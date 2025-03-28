import { useEffect } from 'react';
import { StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { theme } from '../constants/theme';

export default function RootLayout() {
  useEffect(() => {
    // Initialization logic can go here
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <RNStatusBar barStyle="dark-content" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" options={{ gestureEnabled: false }} />
            <Stack.Screen name="dashboard" options={{ gestureEnabled: false }} />
            <Stack.Screen name="send-money" options={{ gestureEnabled: true }} />
            <Stack.Screen name="beneficiaries" options={{ gestureEnabled: true }} />
            <Stack.Screen name="transactions" options={{ gestureEnabled: true }} />
            <Stack.Screen name="profile" options={{ gestureEnabled: true }} />
            <Stack.Screen name="support" options={{ gestureEnabled: true }} />
          </Stack>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
