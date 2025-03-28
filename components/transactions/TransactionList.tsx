import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import CountryFlag from '../ui/CountryFlag';
import TransactionStatus from '../ui/TransactionStatus';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Transaction } from '../../services/transaction';
import theme from '../../constants/theme';
import { Feather } from '@expo/vector-icons';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onTransactionPress: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading,
  onRefresh,
  onLoadMore,
  onTransactionPress,
}) => {
  // Group transactions by month/year
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.createdAt);
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    
    if (!groups[key]) {
      groups[key] = [];
    }
    
    groups[key].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);
  
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
  
  // Flatten the grouped transactions for rendering
  const sections = Object.entries(groupedTransactions).map(([title, data]) => ({ title, data }));
  
  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => onTransactionPress(item)}
    >
      <View style={styles.flagContainer}>
        <CountryFlag
          countryCode={getCurrencyCountryCode(item.destinationCurrency)}
          size="medium"
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
  
  const renderSectionHeader = ({ section }: { section: { title: string; data: Transaction[] } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );
  
  return (
    <FlatList
      data={sections}
      renderItem={({ item }) => (
        <View>
          {renderSectionHeader({ section: item })}
          {item.data.map((transaction) => (
            <React.Fragment key={transaction.id}>
              {renderItem({ item: transaction })}
              <Divider style={styles.divider} />
            </React.Fragment>
          ))}
        </View>
      )}
      keyExtractor={(item) => item.title}
      contentContainerStyle={styles.listContent}
      onRefresh={onRefresh}
      refreshing={isLoading}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={50} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>
            Your transaction history will appear here
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  sectionHeader: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.textLight,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
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
    marginLeft: 72, // To align with the content after the flag
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.textLight,
    marginTop: theme.spacing.lg,
  },
  emptySubtext: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default TransactionList;
