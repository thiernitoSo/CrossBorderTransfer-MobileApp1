import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Card, Chip, Divider, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import TabBar from '../../components/ui/TabBar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorMessage from '../../components/ui/ErrorMessage';
import theme from '../../constants/theme';
import transactionService, { Transaction } from '../../services/transaction';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  // Get status badge color
  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'processing':
        return theme.colors.info;
      case 'failed':
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textLight;
    }
  };
  
  // Format status text
  const getStatusText = () => {
    switch (transaction.status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return transaction.status;
    }
  };
  
  return (
    <Card style={styles.transactionCard} onPress={() => onPress(transaction)}>
      <Card.Content>
        <View style={styles.topRow}>
          <View style={styles.destinationInfo}>
            <Text style={styles.beneficiaryName}>
              To: {transaction.beneficiaryName}
            </Text>
            <Text style={styles.date}>
              {formatDate(transaction.createdAt)}
            </Text>
          </View>
          
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor() + '20' }]}
            textStyle={{ color: getStatusColor() }}
          >
            {getStatusText()}
          </Chip>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.amountRow}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Sent</Text>
            <Text style={styles.amount}>
              {formatCurrency(transaction.sourceAmount, transaction.sourceCurrency)}
            </Text>
          </View>
          
          <Feather name="arrow-right" size={20} color={theme.colors.textLight} />
          
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Received</Text>
            <Text style={styles.amount}>
              {formatCurrency(transaction.destinationAmount, transaction.destinationCurrency)}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.paymentMethod}>
            <Feather 
              name={
                transaction.paymentMethod === 'card' 
                  ? 'credit-card' 
                  : transaction.paymentMethod === 'bank' 
                  ? 'dollar-sign' 
                  : transaction.paymentMethod === 'wallet'
                  ? 'briefcase'
                  : 'smartphone'
              } 
              size={14} 
              color={theme.colors.textLight} 
            />
            <Text style={styles.methodText}>
              {transaction.paymentMethod === 'card' 
                ? 'Card Payment' 
                : transaction.paymentMethod === 'bank' 
                ? 'Bank Transfer' 
                : transaction.paymentMethod === 'wallet'
                ? 'Wallet'
                : transaction.paymentMethod === 'orange_money'
                ? 'Orange Money'
                : 'Mobile Money'}
            </Text>
          </View>
          
          <Text style={styles.reference}>
            Ref: {transaction.reference}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const TransactionDetails: React.FC<{
  transaction: Transaction | null;
  visible: boolean;
  onDismiss: () => void;
  onCancel: (id: string) => void;
}> = ({ transaction, visible, onDismiss, onCancel }) => {
  if (!transaction) return null;
  
  const canCancel = transaction.status === 'pending' || transaction.status === 'processing';
  
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalContent}
    >
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Transaction Details</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Feather name="x" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.modalScroll}>
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Status</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor:
                    transaction.status === 'completed'
                      ? theme.colors.success
                      : transaction.status === 'pending'
                      ? theme.colors.warning
                      : transaction.status === 'processing'
                      ? theme.colors.info
                      : theme.colors.error,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Text>
            {transaction.statusMessage && (
              <Text style={styles.statusMessage}>{transaction.statusMessage}</Text>
            )}
          </View>
        </View>
        
        <Divider style={styles.detailDivider} />
        
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Amount</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sent:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(transaction.sourceAmount, transaction.sourceCurrency)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Received:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(transaction.destinationAmount, transaction.destinationCurrency)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exchange Rate:</Text>
            <Text style={styles.detailValue}>
              1 {transaction.sourceCurrency} = {transaction.exchangeRate.toFixed(4)}{' '}
              {transaction.destinationCurrency}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fee:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(transaction.fee, transaction.sourceCurrency)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={[styles.detailValue, styles.detailTotal]}>
              {formatCurrency(transaction.sourceAmount + transaction.fee, transaction.sourceCurrency)}
            </Text>
          </View>
        </View>
        
        <Divider style={styles.detailDivider} />
        
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Recipient</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{transaction.beneficiaryName}</Text>
          </View>
        </View>
        
        <Divider style={styles.detailDivider} />
        
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Payment Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Method:</Text>
            <Text style={styles.detailValue}>
              {transaction.paymentMethod === 'card'
                ? 'Credit/Debit Card'
                : transaction.paymentMethod === 'bank'
                ? 'Bank Transfer'
                : transaction.paymentMethod === 'wallet'
                ? 'SendAfrika Wallet'
                : transaction.paymentMethod === 'orange_money'
                ? 'Orange Money'
                : 'Mobile Money'}
            </Text>
          </View>
          {transaction.provider && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Provider:</Text>
              <Text style={styles.detailValue}>{transaction.provider}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference:</Text>
            <Text style={styles.detailValue}>{transaction.reference}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(transaction.createdAt)}</Text>
          </View>
        </View>
        
        {transaction.note && (
          <>
            <Divider style={styles.detailDivider} />
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Note</Text>
              <Text style={styles.noteText}>{transaction.note}</Text>
            </View>
          </>
        )}
        
        {canCancel && (
          <>
            <Divider style={styles.detailDivider} />
            <View style={[styles.detailSection, styles.actionSection]}>
              <Button
                title="Cancel Transaction"
                onPress={() => onCancel(transaction.id)}
                mode="outlined"
                color={theme.colors.error}
                fullWidth
              />
            </View>
          </>
        )}
      </ScrollView>
    </Modal>
  );
};

export default function Transactions() {
  const router = useRouter();
  const params = useLocalSearchParams<{ transactionId?: string }>();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  
  useEffect(() => {
    loadTransactions();
  }, []);
  
  useEffect(() => {
    if (params.transactionId) {
      const transaction = transactions.find(t => t.id === params.transactionId);
      if (transaction) {
        handleTransactionPress(transaction);
      }
    }
  }, [params.transactionId, transactions]);
  
  const loadTransactions = async (refresh = false) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const newPage = refresh ? 1 : page;
      const response = await transactionService.getTransactions(newPage, 10);
      
      if (refresh) {
        setTransactions(response.data);
      } else {
        setTransactions(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === 10);
      if (!refresh) {
        setPage(newPage + 1);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadTransactions();
    }
  };
  
  const handleRefresh = () => {
    setPage(1);
    loadTransactions(true);
  };
  
  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };
  
  const handleDismissDetails = () => {
    setShowDetailsModal(false);
    setSelectedTransaction(null);
  };
  
  const handleCancelTransaction = async (id: string) => {
    try {
      setIsCancelling(true);
      await transactionService.cancelTransaction(id);
      
      // Update the transaction in the list
      setTransactions(prev =>
        prev.map(t =>
          t.id === id ? { ...t, status: 'cancelled' } : t
        )
      );
      
      // Update selected transaction
      if (selectedTransaction && selectedTransaction.id === id) {
        setSelectedTransaction({
          ...selectedTransaction,
          status: 'cancelled',
        });
      }
      
      setIsCancelling(false);
    } catch (error) {
      console.error('Failed to cancel transaction:', error);
      setError('Failed to cancel the transaction. Please try again.');
      setIsCancelling(false);
    }
  };
  
  const handleSendMoney = () => {
    router.push('/(authenticated)/send-money');
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header title="Transaction History" />
        
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}
        
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          onScrollEndDrag={handleLoadMore}
        >
          {!isLoading && transactions.length === 0 ? (
            <EmptyState
              icon="clock"
              title="No Transactions Yet"
              message="Your transaction history will appear here once you start sending money."
              actionLabel="Send Money"
              onAction={handleSendMoney}
            />
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                Recent Transactions
              </Text>
              
              {transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onPress={handleTransactionPress}
                />
              ))}
              
              {isLoading && (
                <ActivityIndicator 
                  style={styles.loadingIndicator} 
                  color={theme.colors.primary} 
                  size="small" 
                />
              )}
              
              {!isLoading && !hasMore && transactions.length > 0 && (
                <Text style={styles.endMessage}>
                  You've reached the end of your transaction history.
                </Text>
              )}
            </>
          )}
        </ScrollView>
        
        <Portal>
          <TransactionDetails
            transaction={selectedTransaction}
            visible={showDetailsModal}
            onDismiss={handleDismissDetails}
            onCancel={handleCancelTransaction}
          />
        </Portal>
        
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
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.md,
  },
  transactionCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness.medium,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  destinationInfo: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  date: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
  },
  statusChip: {
    height: 26,
  },
  divider: {
    marginVertical: theme.spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.sm,
  },
  amountContainer: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  amount: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
  reference: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
  },
  loadingIndicator: {
    marginVertical: theme.spacing.md,
  },
  endMessage: {
    textAlign: 'center',
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    borderRadius: theme.roundness.large,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  modalScroll: {
    padding: theme.spacing.lg,
  },
  detailSection: {
    marginBottom: theme.spacing.md,
  },
  detailSectionTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  statusMessage: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: 4,
    marginLeft: 20, // Align with text after indicator
  },
  detailDivider: {
    marginVertical: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
  },
  detailTotal: {
    fontWeight: theme.fontWeights.bold,
    fontSize: theme.fontSizes.md,
  },
  noteText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  actionSection: {
    marginTop: theme.spacing.md,
  },
});