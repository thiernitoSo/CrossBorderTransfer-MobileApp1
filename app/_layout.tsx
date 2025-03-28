import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { theme } from '../constants/theme';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we initialize resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide the splash screen after resources are loaded
    const hideSplashScreen = async () => {
      await SplashScreen.hideAsync();
    };

    hideSplashScreen();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <StatusBar style="auto" />
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
