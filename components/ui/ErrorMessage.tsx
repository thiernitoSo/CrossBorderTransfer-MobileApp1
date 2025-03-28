import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import theme from '../../constants/theme';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  type?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  style,
  type = 'error',
}) => {
  if (!message) return null;

  // Get the appropriate color and icon based on the type
  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: theme.colors.warning + '20', // 20% opacity
          borderColor: theme.colors.warning,
          textColor: theme.colors.warning,
          icon: 'alert-circle',
        };
      case 'info':
        return {
          backgroundColor: theme.colors.info + '20',
          borderColor: theme.colors.info,
          textColor: theme.colors.info,
          icon: 'information',
        };
      case 'error':
      default:
        return {
          backgroundColor: theme.colors.error + '20',
          borderColor: theme.colors.error,
          textColor: theme.colors.error,
          icon: 'alert',
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <Card
      style={[
        styles.container,
        {
          backgroundColor: typeStyles.backgroundColor,
          borderColor: typeStyles.borderColor,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <IconButton
          icon={typeStyles.icon}
          size={24}
          color={typeStyles.textColor}
          style={styles.icon}
        />
        <Text style={[styles.message, { color: typeStyles.textColor }]}>
          {message}
        </Text>
        {onDismiss && (
          <IconButton
            icon="close"
            size={20}
            color={typeStyles.textColor}
            onPress={onDismiss}
            style={styles.closeButton}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    marginVertical: theme.spacing.md,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  icon: {
    margin: 0,
    marginRight: theme.spacing.xs,
  },
  message: {
    flex: 1,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
  },
  closeButton: {
    margin: 0,
  },
});

export default ErrorMessage;
