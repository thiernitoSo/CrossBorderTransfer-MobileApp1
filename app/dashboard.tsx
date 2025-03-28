import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import Header from '../components/ui/Header';
import TabBar from '../components/ui/TabBar';
import BalanceCard from '../components/dashboard/BalanceCard';
import QuickSendCard from '../components/dashboard/QuickSendCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import theme from '../constants/theme';
import beneficiaryService from '../services/beneficiary';
import transactionService from '../services/transaction';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(1200); // Mock balance for demo
  const [refreshing, setRefreshing] = useState(false);
  const [recentBeneficiaries, setRecentBeneficiaries] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load beneficiaries
      const beneficiaries = await beneficiaryService.getBeneficiaries();
      setRecentBeneficiaries(
        beneficiaries.slice(0, 5).map(b => ({
          id: b.id,
          name: `${b.firstName} ${b.lastName}`,
          country: b.country,
        }))
      );

      // Load transactions
      const transactions = await transactionService.getTransactions(1, 5);
      setRecentTransactions(transactions.data);
      
      // Count pending transactions
      const pendingCount = transactions.data.filter(
        t => t.status === 'pending' || t.status === 'processing'
      ).length;
      setPendingTransactions(pendingCount);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header
          title="Dashboard"
          showLogo={true}
          showProfile={true}
        />
        
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Welcome, {user?.firstName || 'User'}
            </Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-CA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          
          <BalanceCard balance={balance} pendingTransactions={pendingTransactions} />
          
          <QuickSendCard recentBeneficiaries={recentBeneficiaries} />
          
          <RecentTransactions transactions={recentTransactions} />
          
          <View style={styles.spacer} />
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
  welcomeContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  welcomeText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
  },
  dateText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  spacer: {
    height: theme.spacing.xl,
  },
});
