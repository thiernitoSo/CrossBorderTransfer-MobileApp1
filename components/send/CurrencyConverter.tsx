import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, Card, TextInput } from 'react-native-paper';
import CountryFlag from '../ui/CountryFlag';
import { getExchangeRate, convertCurrency } from '../../constants/currencies';
import { getCountryByCode } from '../../constants/countries';
import { formatCurrency } from '../../utils/formatters';
import theme from '../../constants/theme';
import { Feather } from '@expo/vector-icons';

interface CurrencyConverterProps {
  sourceCurrency: string;
  destinationCurrency: string;
  amount: string;
  onAmountChange: (amount: string) => void;
  error?: string;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  sourceCurrency,
  destinationCurrency,
  amount,
  onAmountChange,
  error,
}) => {
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [convertedAmount, setConvertedAmount] = useState<string>('0');
  
  // Get country codes from currency codes
  const getCountryFromCurrency = (currencyCode: string): string => {
    // This mapping is a simplified version for demo purposes
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
  
  // Get country objects
  const sourceCountry = getCountryByCode(getCountryFromCurrency(sourceCurrency));
  const destCountry = getCountryByCode(getCountryFromCurrency(destinationCurrency));
  
  // Update exchange rate and converted amount when currencies change
  useEffect(() => {
    if (sourceCurrency && destinationCurrency) {
      const rate = getExchangeRate(sourceCurrency, destinationCurrency);
      setExchangeRate(rate);
      
      if (amount) {
        const converted = convertCurrency(
          parseFloat(amount), 
          sourceCurrency, 
          destinationCurrency
        );
        setConvertedAmount(converted.toString());
      }
    }
  }, [sourceCurrency, destinationCurrency, amount]);
  
  // Handle amount input change
  const handleAmountChange = (value: string) => {
    // Allow only numeric input with up to 2 decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    
    if (value === '' || regex.test(value)) {
      onAmountChange(value);
      
      if (value && exchangeRate) {
        const converted = convertCurrency(
          parseFloat(value) || 0, 
          sourceCurrency, 
          destinationCurrency
        );
        setConvertedAmount(converted.toString());
      } else {
        setConvertedAmount('0');
      }
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Send</Text>
          {exchangeRate > 0 && (
            <View style={styles.rateContainer}>
              <Feather name="refresh-cw" size={14} color={theme.colors.primary} />
              <Text style={styles.rateText}>
                1 {sourceCurrency} = {exchangeRate.toFixed(2)} {destinationCurrency}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.currencyContainer}>
          <View style={styles.flagContainer}>
            {sourceCountry && (
              <CountryFlag 
                countryCode={sourceCountry.code} 
                size="medium" 
              />
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.currencyCode}>{sourceCurrency}</Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              style={styles.input}
              keyboardType="numeric"
              placeholder="0.00"
              error={!!error}
              dense
              mode="flat"
              underlineColor="transparent"
              theme={{ colors: { primary: theme.colors.primary } }}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </View>
        
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Feather name="arrow-down" size={20} color={theme.colors.textLight} />
          <View style={styles.divider} />
        </View>
        
        <View style={styles.currencyContainer}>
          <View style={styles.flagContainer}>
            {destCountry && (
              <CountryFlag 
                countryCode={destCountry.code} 
                size="medium" 
              />
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.currencyCode}>{destinationCurrency}</Text>
            <Text style={styles.convertedAmount}>
              {formatCurrency(parseFloat(convertedAmount) || 0, destinationCurrency)}
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10', // 10% opacity
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness.small,
  },
  rateText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.fontWeights.medium,
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  flagContainer: {
    marginRight: theme.spacing.md,
  },
  inputContainer: {
    flex: 1,
  },
  currencyCode: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    paddingHorizontal: 0,
    height: 40,
  },
  convertedAmount: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginTop: 6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.xs,
    marginTop: theme.spacing.xs,
  },
});

export default CurrencyConverter;
