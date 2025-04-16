import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CurrencyDisplay from '../ui/CurrencyDisplay';
import theme from '../../constants/theme';
import { sourceCountry } from '../../constants/countries';

interface BalanceCardProps {
  balance: number;
  pendingTransactions: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  pendingTransactions,
}) => {
  const router = useRouter();

  const handleSendMoney = () => {
    router.push('/send-money');
  };

  const handleAddMoney = () => {
    // Navigate to add money screen or show a modal
    // For MVP, we'll just show send money
    router.push('/send-money');
  };

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <CurrencyDisplay
            amount={balance}
            currencyCode={sourceCountry.currencyCode}
            size="large"
          />
          
          {pendingTransactions > 0 && (
            <View style={styles.pendingContainer}>
              <Feather name="clock" size={14} color={theme.colors.warning} />
              <Text style={styles.pendingText}>
                {pendingTransactions} pending transaction{pendingTransactions > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.sendButton]}
            onPress={handleSendMoney}
          >
            <Feather name="send" size={20} color={theme.colors.surface} />
            <Text style={styles.actionButtonText}>Send Money</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={handleAddMoney}
          >
            <Feather name="plus" size={20} color={theme.colors.surface} />
            <Text style={styles.actionButtonText}>Add Money</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.roundness.large,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 3,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
  },
  content: {
    padding: theme.spacing.md,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  balanceLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.warning + '10', // 10% opacity
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness.small,
  },
  pendingText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.warning,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.fontWeights.medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness.medium,
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
  },
  addButton: {
    backgroundColor: theme.colors.secondary,
  },
  actionButtonText: {
    color: theme.colors.surface,
    fontWeight: theme.fontWeights.medium,
    marginLeft: theme.spacing.xs,
    fontSize: theme.fontSizes.sm,
  },
});

export default BalanceCard;
