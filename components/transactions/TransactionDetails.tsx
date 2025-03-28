import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CountryFlag from '../ui/CountryFlag';
import TransactionStatus from '../ui/TransactionStatus';
import { Transaction } from '../../services/transaction';
import {
  formatCurrency,
  formatDateTime,
  formatReference,
} from '../../utils/formatters';
import theme from '../../constants/theme';
import { Feather } from '@expo/vector-icons';

interface TransactionDetailsProps {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transaction,
  onClose,
}) => {
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
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your transfer is being processed';
      case 'processing':
        return 'Your transfer is on its way to the recipient';
      case 'completed':
        return 'Your transfer has been delivered';
      case 'failed':
        return 'Your transfer could not be completed';
      default:
        return '';
    }
  };
  
  const handleShare = async () => {
    try {
      const message = `I sent money to ${transaction.beneficiaryName} using SendAfrika. Transaction Reference: ${formatReference(transaction.reference)}`;
      await Share.share({
        message,
        title: 'SendAfrika Transaction',
      });
    } catch (error) {
      console.error('Error sharing transaction:', error);
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Feather name="share-2" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView}>
          <View style={styles.statusContainer}>
            <TransactionStatus status={transaction.status} size="large" showText />
            <Text style={styles.statusText}>
              {getStatusText(transaction.status)}
            </Text>
          </View>
          
          <Card style={styles.amountCard}>
            <Card.Content style={styles.amountCardContent}>
              <View style={styles.sourceAmountContainer}>
                <Text style={styles.amountLabel}>You sent</Text>
                <Text style={styles.sourceAmount}>
                  {formatCurrency(transaction.sourceAmount, transaction.sourceCurrency)}
                </Text>
              </View>
              
              <View style={styles.conversionContainer}>
                <Feather name="arrow-down" size={20} color={theme.colors.textLight} />
                <Text style={styles.exchangeRateText}>
                  1 {transaction.sourceCurrency} = {transaction.exchangeRate.toFixed(4)}{' '}
                  {transaction.destinationCurrency}
                </Text>
              </View>
              
              <View style={styles.destinationAmountContainer}>
                <Text style={styles.amountLabel}>Recipient gets</Text>
                <Text style={styles.destinationAmount}>
                  {formatCurrency(
                    transaction.destinationAmount,
                    transaction.destinationCurrency
                  )}
                </Text>
                <CountryFlag
                  countryCode={getCurrencyCountryCode(transaction.destinationCurrency)}
                  size="small"
                  style={styles.countryFlag}
                />
              </View>
            </Card.Content>
          </Card>
          
          <Card style={styles.detailsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Transaction Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference</Text>
                <Text style={styles.detailValue}>
                  {formatReference(transaction.reference)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {formatDateTime(transaction.createdAt)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fee</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(transaction.fee, transaction.sourceCurrency)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>
                  {transaction.paymentMethod === 'card'
                    ? 'Credit/Debit Card'
                    : transaction.paymentMethod === 'bank'
                    ? 'Bank Transfer'
                    : 'Wallet'}
                </Text>
              </View>
              
              {transaction.note && (
                <View style={styles.noteContainer}>
                  <Text style={styles.detailLabel}>Note</Text>
                  <Text style={styles.noteText}>{transaction.note}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
          
          <Card style={styles.detailsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Recipient</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{transaction.beneficiaryName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Country</Text>
                <View style={styles.countryContainer}>
                  <CountryFlag
                    countryCode={getCurrencyCountryCode(transaction.destinationCurrency)}
                    size="small"
                    style={styles.detailFlag}
                  />
                  <Text style={styles.detailValue}>
                    {getCurrencyCountryCode(transaction.destinationCurrency)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
          
          {transaction.status === 'pending' && (
            <Button
              mode="outlined"
              style={styles.cancelButton}
              icon="close"
              onPress={() => {
                // Handle cancel transaction
                console.log('Cancel transaction:', transaction.id);
              }}
            >
              Cancel Transfer
            </Button>
          )}
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  shareButton: {
    padding: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  statusText: {
    fontSize: theme.fontSizes.md,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  amountCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness.medium,
  },
  amountCardContent: {
    padding: theme.spacing.md,
  },
  sourceAmountContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  amountLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  sourceAmount: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
  },
  conversionContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  exchangeRateText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  destinationAmountContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  destinationAmount: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.success,
  },
  countryFlag: {
    position: 'absolute',
    right: -30,
    top: 25,
  },
  detailsCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness.medium,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailFlag: {
    marginRight: theme.spacing.sm,
  },
  noteContainer: {
    marginTop: theme.spacing.md,
  },
  noteText: {
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness.small,
  },
  cancelButton: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  bottomSpacer: {
    height: theme.spacing.xxl,
  },
});

export default TransactionDetails;
