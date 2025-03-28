import React from 'react';
import { StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import theme from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'contained' | 'outlined' | 'text';
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  icon?: string;
  uppercase?: boolean;
  compact?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  mode = 'contained',
  color,
  loading = false,
  disabled = false,
  style,
  labelStyle,
  icon,
  uppercase = false,
  compact = false,
  fullWidth = false,
  size = 'medium',
}) => {
  // Determine styles based on size
  const sizeStyles = {
    small: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.fontSizes.sm,
    },
    medium: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      fontSize: theme.fontSizes.md,
    },
    large: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      fontSize: theme.fontSizes.lg,
    },
  };

  const buttonStyle = [
    styles.button,
    fullWidth && styles.fullWidth,
    size && { height: sizeStyles[size].paddingVertical * 2 + sizeStyles[size].fontSize * 1.5 },
    style,
  ];

  const textStyle = [
    size && { fontSize: sizeStyles[size].fontSize },
    { fontWeight: theme.fontWeights.semibold },
    labelStyle,
  ];

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      color={color || (mode === 'contained' ? theme.colors.primary : undefined)}
      style={buttonStyle}
      labelStyle={textStyle}
      icon={icon}
      uppercase={uppercase}
      compact={compact}
      contentStyle={styles.content}
    >
      {title}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.roundness.medium,
    marginVertical: theme.spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
