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
    backgroundColor: theme.colors.error + '10', // 10% opacity
    borderWidth: 1,
    borderColor: theme.colors.error + '30', // 30% opacity
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.roundness.medium,
    padding: theme.spacing.lg,
    alignItems: 'center',
    shadowColor: theme.colors.error,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
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