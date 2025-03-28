import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Header from '../components/ui/Header';
import TabBar from '../components/ui/TabBar';
import TransactionList from '../components/transactions/TransactionList';
import TransactionDetails from '../components/transactions/TransactionDetails';
import ErrorMessage from '../components/ui/ErrorMessage';
import theme from '../constants/theme';
import transactionService, { Transaction } from '../services/transaction';

export default function Transactions() {
  const params = useLocalSearchParams<{ transactionId?: string }>();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  useEffect(() => {
    loadTransactions();
  }, []);
  
  useEffect(() => {
    // If transactionId is provided in the URL, show the details
    if (params.transactionId) {
      loadTransactionDetails(params.transactionId);
    }
  }, [params.transactionId]);
  
  const loadTransactions = async (refresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newPage = refresh ? 1 : page;
      const response = await transactionService.getTransactions(newPage, 10);
      
      setTransactions(refresh ? response.data : [...transactions, ...response.data]);
      setHasMore(response.data.length === 10);
      setPage(newPage + 1);
    } catch (error) {
      setError('Failed to load transactions. Please try again.');
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadTransactionDetails = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we already have this transaction in our list
      const existingTransaction = transactions.find(t => t.id === id);
      
      if (existingTransaction) {
        setSelectedTransaction(existingTransaction);
      } else {
        const transaction = await transactionService.getTransaction(id);
        setSelectedTransaction(transaction);
      }
      
      setIsDetailsVisible(true);
    } catch (error) {
      setError('Failed to load transaction details. Please try again.');
      console.error('Failed to load transaction details:', error);
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
    loadTransactions(true);
  };
  
  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsVisible(true);
  };
  
  const handleCloseDetails = () => {
    setIsDetailsVisible(false);
    setSelectedTransaction(null);
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header
          title="Transactions"
          showBackButton={true}
        />
        
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}
        
        <TransactionList
          transactions={transactions}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          onTransactionPress={handleTransactionPress}
        />
        
        <Modal
          visible={isDetailsVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseDetails}
        >
          {selectedTransaction && (
            <TransactionDetails
              transaction={selectedTransaction}
              onClose={handleCloseDetails}
            />
          )}
        </Modal>
        
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
});
