import { useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import theme from '../constants/theme';
import { Feather } from '@expo/vector-icons';

export default function Index() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check authentication status and redirect accordingly
    const checkAuthAndRedirect = async () => {
      // Add a small delay to show the splash screen
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (isLoading) return;
      
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/auth');
      }
    };

    checkAuthAndRedirect();
  }, [isLoading, isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Feather name="send" size={50} color={theme.colors.primary} />
        <Text style={styles.logoText}>SendAfrika</Text>
      </View>
      
      <Text style={styles.tagline}>Sending Money to Africa Made Simple</Text>
      
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoText: {
    fontSize: theme.fontSizes.xxxl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  tagline: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  loading: {
    marginTop: theme.spacing.xl,
  },
});
