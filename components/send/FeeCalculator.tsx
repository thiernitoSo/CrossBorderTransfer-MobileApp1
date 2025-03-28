import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { TransactionQuote } from '../../services/transaction';
import { formatCurrency } from '../../utils/formatters';
import theme from '../../constants/theme';

interface FeeCalculatorProps {
  quote: TransactionQuote;
}

const FeeCalculator: React.FC<FeeCalculatorProps> = ({ quote }) => {
  const {
    sourceAmount,
    sourceCurrency,
    destinationAmount,
    destinationCurrency,
    exchangeRate,
    fee,
    totalAmount,
    expiresAt,
  } = quote;

  // Calculate time remaining for quote
  const getExpiryTime = () => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    
    // Calculate minutes remaining
    const minutesRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / 60000);
    
    if (minutesRemaining <= 0) {
      return 'Expired';
    } else if (minutesRemaining === 1) {
      return '1 minute remaining';
    } else {
      return `${minutesRemaining} minutes remaining`;
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.title}>Transaction Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>You send</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(sourceAmount, sourceCurrency)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fee</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(fee, sourceCurrency)}
          </Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total to pay</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(totalAmount, sourceCurrency)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Recipient gets</Text>
          <Text style={styles.recipientValue}>
            {formatCurrency(destinationAmount, destinationCurrency)}
          </Text>
        </View>
        
        <View style={styles.rateContainer}>
          <Text style={styles.rateText}>
            Rate: 1 {sourceCurrency} = {exchangeRate.toFixed(4)} {destinationCurrency}
          </Text>
          <Text style={styles.expiryText}>{getExpiryTime()}</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.roundness.medium,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
  },
  summaryValue: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  divider: {
    marginVertical: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  totalValue: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  recipientValue: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.success,
  },
  rateContainer: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness.small,
  },
  rateText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
  },
  expiryText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.warning,
    marginTop: 2,
  },
});

export default FeeCalculator;
