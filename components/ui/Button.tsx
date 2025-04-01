import React from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import theme from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'filled' | 'outlined' | 'text';
  color?: string;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  mode = 'filled',
  color,
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.disabledBackground;
    if (mode === 'filled') return color || theme.colors.primary;
    return 'transparent';
  };

  const getBorderColor = () => {
    if (disabled) return theme.colors.disabledBackground;
    if (mode === 'outlined') return color || theme.colors.primary;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.disabledText;
    if (mode === 'filled') return '#fff';
    return color || theme.colors.primary;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: mode === 'outlined' ? 1 : 0,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentContainer}>
          {icon && (
            <Feather
              name={icon as any}
              size={16}
              color={getTextColor()}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.roundness.medium,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
    textAlign: 'center',
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
});

export default Button;