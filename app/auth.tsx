import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import theme from '../constants/theme';
import { Feather } from '@expo/vector-icons';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.replace('/(authenticated)/dashboard');
    }
  }, [user, router]);

  const handleSwitchToRegister = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  const isLandscape = width > height;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.container, isLandscape && styles.landscapeContainer]}>
          {/* Left side: Form */}
          <View style={[styles.formContainer, isLandscape && styles.formContainerLandscape]}>
            <View style={styles.logoContainer}>
              <Feather name="send" size={36} color={theme.colors.primary} />
              <Text style={styles.logoText}>SendAfrika</Text>
            </View>
            
            {isLogin ? (
              <LoginForm onSwitchToRegister={handleSwitchToRegister} />
            ) : (
              <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
            )}
          </View>
          
          {/* Right side: Hero section */}
          <View style={[styles.heroContainer, isLandscape && styles.heroContainerLandscape]}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Send Money to Africa</Text>
              <Text style={styles.heroSubtitle}>
                Fast, secure and affordable money transfers from Canada to Africa
              </Text>
              
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Feather name="shield" size={20} color={theme.colors.primary} />
                  <Text style={styles.featureText}>Secure transactions</Text>
                </View>
                <View style={styles.featureItem}>
                  <Feather name="zap" size={20} color={theme.colors.primary} />
                  <Text style={styles.featureText}>Fast delivery</Text>
                </View>
                <View style={styles.featureItem}>
                  <Feather name="dollar-sign" size={20} color={theme.colors.primary} />
                  <Text style={styles.featureText}>Competitive rates</Text>
                </View>
                <View style={styles.featureItem}>
                  <Feather name="smartphone" size={20} color={theme.colors.primary} />
                  <Text style={styles.featureText}>Mobile money integration</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  landscapeContainer: {
    flexDirection: 'row',
  },
  formContainer: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  formContainerLandscape: {
    width: '50%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoText: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  heroContainer: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainerLandscape: {
    width: '50%',
  },
  heroContent: {
    maxWidth: 500,
  },
  heroTitle: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.surface,
    opacity: 0.8,
    marginBottom: theme.spacing.xl,
  },
  featureList: {
    marginTop: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureText: {
    color: theme.colors.surface,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.md,
  },
});
