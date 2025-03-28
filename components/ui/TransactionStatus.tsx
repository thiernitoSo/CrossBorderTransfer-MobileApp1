import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Badge } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import theme from '../../constants/theme';

interface TransactionStatusProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: ViewStyle;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  size = 'medium',
  showText = true,
  style,
}) => {
  // Define status configurations
  const statusConfig = {
    pending: {
      color: theme.colors.warning,
      icon: 'clock',
      label: 'Pending',
    },
    processing: {
      color: theme.colors.info,
      icon: 'refresh-cw',
      label: 'Processing',
    },
    completed: {
      color: theme.colors.success,
      icon: 'check-circle',
      label: 'Completed',
    },
    failed: {
      color: theme.colors.error,
      icon: 'alert-circle',
      label: 'Failed',
    },
  };
  
  const config = statusConfig[status];
  
  // Determine size dimensions
  const sizeConfig = {
    small: {
      iconSize: 12,
      fontSize: theme.fontSizes.xs,
      containerHeight: 20,
    },
    medium: {
      iconSize: 16,
      fontSize: theme.fontSizes.sm,
      containerHeight: 24,
    },
    large: {
      iconSize: 20,
      fontSize: theme.fontSizes.md,
      containerHeight: 32,
    },
  };
  
  const { iconSize, fontSize, containerHeight } = sizeConfig[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${config.color}20`, // 20% opacity
          height: containerHeight,
        },
        style,
      ]}
    >
      <Feather name={config.icon as any} size={iconSize} color={config.color} />
      
      {showText && (
        <Text
          style={[
            styles.text,
            { color: config.color, fontSize },
          ]}
        >
          {config.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.roundness.small,
  },
  text: {
    marginLeft: theme.spacing.xs,
    fontWeight: theme.fontWeights.medium,
  },
});

export default TransactionStatus;
