import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import theme from '../../constants/theme';

interface PaymentMethodProps {
  selectedMethod: string;
  onSelectMethod: (method: string) => void;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({
  selectedMethod,
  onSelectMethod,
}) => {
  const paymentMethods = [
    {
      id: 'card',
      label: 'Credit/Debit Card',
      icon: 'credit-card',
      description: 'Pay with Visa, MasterCard, or other major credit cards',
    },
    {
      id: 'bank',
      label: 'Bank Transfer',
      icon: 'dollar-sign',
      description: 'Direct transfer from your Canadian bank account',
    },
    {
      id: 'wallet',
      label: 'SendAfrika Wallet',
      icon: 'briefcase',
      description: 'Use your available balance in your SendAfrika wallet',
    },
    {
      id: 'orange_money',
      label: 'Orange Money',
      icon: 'smartphone',
      description: 'Send directly to Orange Money mobile wallets in West & Central Africa',
    },
  ];

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodItem,
              selectedMethod === method.id && styles.selectedMethodItem,
            ]}
            onPress={() => onSelectMethod(method.id)}
          >
            <View style={styles.methodIconContainer}>
              <Feather
                name={method.icon as any}
                size={24}
                color={
                  selectedMethod === method.id
                    ? theme.colors.primary
                    : theme.colors.textLight
                }
              />
            </View>
            
            <View style={styles.methodInfo}>
              <Text
                style={[
                  styles.methodLabel,
                  selectedMethod === method.id && styles.selectedMethodLabel,
                ]}
              >
                {method.label}
              </Text>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
            
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  selectedMethod === method.id && styles.selectedRadioOuter,
                ]}
              >
                {selectedMethod === method.id && <View style={styles.radioInner} />}
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        <View style={styles.noteContainer}>
          <Text style={styles.noteTitle}>Note:</Text>
          <Text style={styles.noteText}>
            All payment methods are secure and processed in compliance with Canadian financial regulations.
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.roundness.medium,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.medium,
    marginBottom: theme.spacing.md,
  },
  selectedMethodItem: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '05', // 5% opacity
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    marginRight: theme.spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  selectedMethodLabel: {
    color: theme.colors.primary,
  },
  methodDescription: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  radioContainer: {
    marginLeft: theme.spacing.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioOuter: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  noteContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.small,
    marginTop: theme.spacing.sm,
  },
  noteTitle: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    marginBottom: theme.spacing.xs,
  },
  noteText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
  },
});

export default PaymentMethod;
