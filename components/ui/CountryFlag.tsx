import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import theme from '../../constants/theme';

interface CountryFlagProps {
  countryCode: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const CountryFlag: React.FC<CountryFlagProps> = ({
  countryCode,
  size = 'medium',
  style,
}) => {
  // Get flag emoji from country code
  const getFlagEmoji = (code: string) => {
    if (!code || code.length !== 2) return '🏳️';
    
    // Convert country code to flag emoji (ISO 3166-1 alpha-2)
    // Each letter is converted to its corresponding Regional Indicator Symbol
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    
    return String.fromCodePoint(...codePoints);
  };
  
  // Determine size based on prop
  const flagSize = {
    small: 24,
    medium: 32,
    large: 48,
  }[size];
  
  // Adjust font size to scale properly with container
  const fontSize = flagSize * 0.75;

  return (
    <View
      style={[
        styles.container,
        {
          width: flagSize,
          height: flagSize,
          borderRadius: flagSize / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.flag, { fontSize }]}>
        {getFlagEmoji(countryCode)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flag: {
    textAlign: 'center',
    lineHeight: 32, // Needed for proper emoji alignment
  },
});

export default CountryFlag;
