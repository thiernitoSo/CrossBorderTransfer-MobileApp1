import React, { useState } from 'react';
import { StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import theme from '../../constants/theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  maxLength?: number;
  onBlur?: (e: any) => void;
}

const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  label,
  placeholder,
  secureTextEntry = false,
  error,
  disabled = false,
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  style,
  inputStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  maxLength,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        label={label}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        error={!!error}
        disabled={disabled}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        keyboardType={keyboardType}
        style={[styles.input, style]}
        theme={{
          colors: {
            primary: theme.colors.primary,
            error: theme.colors.error,
          },
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        left={leftIcon ? <TextInput.Icon name={leftIcon} color={theme.colors.textLight} /> : undefined}
        right={
          secureTextEntry ? (
            <TextInput.Icon
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              color={theme.colors.textLight}
              onPress={togglePasswordVisibility}
            />
          ) : rightIcon ? (
            <TextInput.Icon
              name={rightIcon}
              color={theme.colors.textLight}
              onPress={onRightIconPress}
            />
          ) : undefined
        }
        maxLength={maxLength}
        mode="outlined"
        outlineColor={isFocused ? theme.colors.primary : theme.colors.border}
      />
      {error && (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    marginVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: -theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
});

export default Input;
