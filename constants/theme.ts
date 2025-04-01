import { DefaultTheme } from 'react-native-paper';

// Financial app color scheme: professional, trustworthy, and clean
const colors = {
  // Primary colors
  primary: '#0056B3', // Deep blue for trust and professionalism
  primaryLight: '#4D8FCF',
  primaryDark: '#003A78',
  
  // Secondary colors
  secondary: '#FF7E00', // Orange accent for calls to action
  secondaryLight: '#FFA44D',
  secondaryDark: '#CC6600',
  
  // Neutrals
  background: '#F7F9FC', // Light background
  surface: '#FFFFFF',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#FFC107',
  info: '#2196F3',
  pending: '#9C27B0',
  
  // Text colors
  text: '#1E293B', // Dark gray for readability
  textLight: '#64748B',
  textMuted: '#94A3B8',
  
  // Border colors
  border: '#E2E8F0',
  borderDark: '#CBD5E1',
  
  // Transaction status colors
  statusComplete: '#38A169',
  statusPending: '#DD6B20',
  statusFailed: '#E53E3E',
  
  // Other utility colors
  divider: '#E2E8F0',
  overlay: 'rgba(0, 0, 0, 0.5)',
  card: '#FFFFFF',
  notification: '#FF4081',
  
  // Button states
  disabledBackground: '#E2E8F0',
  disabledText: '#94A3B8',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const roundness = {
  small: 4,
  medium: 8,
  large: 16,
};

const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: 'bold' as const,
};

// Extend the default theme with our custom theme
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    text: colors.text,
    onSurface: colors.text,
    disabled: colors.textMuted,
    placeholder: colors.textLight,
    backdrop: colors.overlay,
    notification: colors.notification,
  },
  roundness: roundness.medium,
};

// Export our custom theme objects
export default {
  colors,
  spacing,
  roundness,
  fontSizes,
  fontWeights,
};
