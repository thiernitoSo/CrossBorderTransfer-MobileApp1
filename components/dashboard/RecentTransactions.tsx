import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import CountryFlag from '../ui/CountryFlag';
import TransactionStatus from '../ui/TransactionStatus';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Transaction } from '../../services/transaction';
import theme from '../../constants/theme';
import { Feather } from '@expo/vector-icons';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const router = useRouter();

  const handleViewAll = () => {
    router.push('/transactions');
  };

  const handleTransactionPress = (transactionId: string) => {
    router.push({
      pathname: '/transactions',
      params: { transactionId },
    });
  };

  // Determine the country code based on destination currency
  const getCurrencyCountryCode = (currencyCode: string) => {
    // This is a simplified mapping for demo purposes
    const mapping: Record<string, string> = {
      'CAD': 'CA',
      'GHS': 'GH',
      'NGN': 'NG',
      'KES': 'KE',
      'RWF': 'RW',
      'XOF': 'SN', // Using Senegal for CFA
      'XAF': 'CM', // Using Cameroon for CFA
      'ZAR': 'ZA',
      'TZS': 'TZ',
      'UGX': 'UG',
      'ETB': 'ET',
      'MAD': 'MA',
    };
    
    return mapping[currencyCode] || 'CA';
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => handleTransactionPress(item.id)}
    >
      <View style={styles.flagContainer}>
        <CountryFlag 
          countryCode={getCurrencyCountryCode(item.destinationCurrency)} 
          size="small" 
        />
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.beneficiaryName}>{item.beneficiaryName}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>
          {formatCurrency(item.sourceAmount, item.sourceCurrency)}
        </Text>
        <TransactionStatus status={item.status} size="small" />
      </View>
    </TouchableOpacity>
  );

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Transactions</Text>
          
          <TouchableOpacity onPress={handleViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={40} color={theme.colors.textLight} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your recent transactions will appear here</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.roundness.medium,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.medium,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  flagContainer: {
    marginRight: theme.spacing.md,
  },
  detailsContainer: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  transactionDate: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});

export default RecentTransactions;
