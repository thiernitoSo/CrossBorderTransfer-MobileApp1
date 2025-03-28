import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Divider, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Header from '../components/ui/Header';
import TabBar from '../components/ui/TabBar';
import ProfileForm from '../components/profile/ProfileForm';
import KYCForm from '../components/profile/KYCForm';
import ErrorMessage from '../components/ui/ErrorMessage';
import theme from '../constants/theme';

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [activeSection, setActiveSection] = useState<'profile' | 'kyc' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleLogout = async () => {
    try {
      await logout();
      // Navigation is handled in AuthContext
    } catch (error) {
      setError('Failed to log out. Please try again.');
    }
  };
  
  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileForm onCancel={() => setActiveSection(null)} />;
      case 'kyc':
        return <KYCForm onCancel={() => setActiveSection(null)} />;
      default:
        return renderProfileOverview();
    }
  };
  
  const renderProfileOverview = () => {
    if (!user) return null;
    
    return (
      <>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.userInfoContainer}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user.firstName?.charAt(0) || ''}
                  {user.lastName?.charAt(0) || ''}
                </Text>
              </View>
              
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userStatus}>
                  {user.isVerified ? 'Verified Account' : 'Unverified Account'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            
            <List.Item
              title="Personal Information"
              description="Update your name, email, and contact details"
              left={props => <List.Icon {...props} icon="account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setActiveSection('profile')}
              style={styles.listItem}
            />
            <Divider />
            
            <List.Item
              title="Identification & Verification"
              description="Complete KYC requirements for sending money"
              left={props => <List.Icon {...props} icon="shield-check" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setActiveSection('kyc')}
              style={styles.listItem}
            />
            <Divider />
            
            <List.Item
              title="Payment Methods"
              description="Manage your cards and bank accounts"
              left={props => <List.Icon {...props} icon="credit-card" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // This would navigate to payment methods in a full implementation
                setError('Payment methods feature coming soon.');
              }}
              style={styles.listItem}
            />
            <Divider />
            
            <List.Item
              title="Security"
              description="Change password and security settings"
              left={props => <List.Icon {...props} icon="lock" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // This would navigate to security settings in a full implementation
                setError('Security settings feature coming soon.');
              }}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Support</Text>
            
            <List.Item
              title="Help Center"
              description="FAQs and guides on how to use SendAfrika"
              left={props => <List.Icon {...props} icon="help-circle" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/support')}
              style={styles.listItem}
            />
            <Divider />
            
            <List.Item
              title="Contact Support"
              description="Get help from our customer service team"
              left={props => <List.Icon {...props} icon="message-circle" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/support')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>
        
        <Card style={styles.logoutCard} onPress={handleLogout}>
          <Card.Content style={styles.logoutContent}>
            <Feather name="log-out" size={20} color={theme.colors.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Card.Content>
        </Card>
      </>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header
          title={activeSection === 'profile' ? 'Edit Profile' : activeSection === 'kyc' ? 'Identity Verification' : 'Profile'}
          showBackButton={true}
        />
        
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {renderSection()}
        </ScrollView>
        
        <TabBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness.medium,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  avatarText: {
    color: theme.colors.surface,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
  },
  userEmail: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  userStatus: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.success,
    marginTop: theme.spacing.xs,
    fontWeight: theme.fontWeights.medium,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
  },
  listItem: {
    paddingVertical: theme.spacing.sm,
  },
  logoutCard: {
    marginBottom: theme.spacing.xxl,
    borderRadius: theme.roundness.medium,
    borderWidth: 1,
    borderColor: theme.colors.error + '30', // 30% opacity
  },
  logoutContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  logoutText: {
    color: theme.colors.error,
    fontWeight: theme.fontWeights.medium,
    marginLeft: theme.spacing.sm,
  },
});
