import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import theme from '../../constants/theme';

interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Feather name="alert-circle" size={20} color={theme.colors.error} style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
        <Feather name="x" size={18} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.error + '15', // 15% opacity
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.roundness.small,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  message: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
  },
  closeButton: {
    padding: 2,
  },
});

export default ErrorMessage;