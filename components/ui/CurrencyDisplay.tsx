import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import CountryFlag from './CountryFlag';
import { formatCurrency } from '../../utils/formatters';
import { getCountryByCode } from '../../constants/countries';
import theme from '../../constants/theme';

interface CurrencyDisplayProps {
  amount: number;
  currencyCode: string;
  showFlag?: boolean;
  showSymbol?: boolean;
  showCode?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currencyCode,
  showFlag = true,
  showSymbol = true,
  showCode = true,
  size = 'medium',
  style,
}) => {
  // Find country based on currency code
  const findCountryByCode = (code: string) => {
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
    
    return mapping[code] || 'CA';
  };
  
  const countryCode = findCountryByCode(currencyCode);
  const country = getCountryByCode(countryCode);
  
  // Format currency amount
  const formattedAmount = formatCurrency(amount, currencyCode);
  
  // Determine text size based on prop
  const fontSize = {
    small: theme.fontSizes.sm,
    medium: theme.fontSizes.md,
    large: theme.fontSizes.xl,
  }[size];
  
  const flagSize = {
    small: 'small',
    medium: 'small',
    large: 'medium',
  }[size] as 'small' | 'medium' | 'large';

  return (
    <View style={[styles.container, style]}>
      {showFlag && country && (
        <View style={styles.flagContainer}>
          <CountryFlag countryCode={countryCode} size={flagSize} />
        </View>
      )}
      
      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amountText,
            { fontSize },
            size === 'large' && styles.largeText,
          ]}
        >
          {formattedAmount}
        </Text>
        
        {showCode && (
          <Text
            style={[
              styles.codeText,
              { fontSize: fontSize * 0.7 },
            ]}
          >
            {currencyCode}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagContainer: {
    marginRight: theme.spacing.xs,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
  },
  largeText: {
    fontWeight: theme.fontWeights.bold,
  },
  codeText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.textLight,
  },
});

export default CurrencyDisplay;
