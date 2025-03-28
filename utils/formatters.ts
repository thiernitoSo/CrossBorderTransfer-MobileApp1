import { getCountryByCode } from '../constants/countries';

/**
 * Format currency amount with proper symbol
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string,
  options: Intl.NumberFormatOptions = {}
): string => {
  const country = getCountryByCode(
    Object.entries(currencyCodeToCountryCode).find(
      ([_, code]) => code === currencyCode
    )?.[0] || 'CA'
  );

  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  try {
    return new Intl.NumberFormat('en-CA', {
      ...defaultOptions,
      ...options,
    }).format(amount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    const symbol = country?.currencySymbol || '$';
    return `${symbol}${amount.toFixed(2)}`;
  }
};

/**
 * Format date to readable format
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  try {
    return new Intl.DateTimeFormatter('en-CA', {
      ...defaultOptions,
      ...options,
    }).format(dateObj);
  } catch (error) {
    // Fallback formatting if Intl.DateTimeFormatter fails
    return dateObj.toLocaleDateString('en-CA', {
      ...defaultOptions,
      ...options,
    });
  }
};

/**
 * Format time to readable format
 */
export const formatTime = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };

  try {
    return dateObj.toLocaleTimeString('en-CA', {
      ...defaultOptions,
      ...options,
    });
  } catch (error) {
    // Fallback if toLocaleTimeString fails
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
};

/**
 * Format complete datetime
 */
export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

/**
 * Format phone number to international format
 */
export const formatPhoneNumber = (
  phoneNumber: string,
  countryCode = 'CA'
): string => {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Basic formatting based on country code
  if (countryCode === 'CA' || countryCode === 'US') {
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
  }
  
  // Return original if no formatting is applied
  return phoneNumber;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Format transaction reference number
 */
export const formatReference = (reference: string): string => {
  if (!reference) return '';
  
  // Format as TX-XXXXX-XXXXX
  if (reference.length >= 10) {
    const formatted = reference.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `TX-${formatted.slice(0, 5)}-${formatted.slice(5, 10)}`;
  }
  
  return reference.toUpperCase();
};

/**
 * Helper mapping for currency codes to country codes
 */
const currencyCodeToCountryCode: Record<string, string> = {
  'CA': 'CAD', // Canada
  'GH': 'GHS', // Ghana
  'NG': 'NGN', // Nigeria
  'KE': 'KES', // Kenya
  'RW': 'RWF', // Rwanda
  'SN': 'XOF', // Senegal
  'CI': 'XOF', // Côte d'Ivoire
  'CM': 'XAF', // Cameroon
  'ZA': 'ZAR', // South Africa
  'TZ': 'TZS', // Tanzania
  'UG': 'UGX', // Uganda
  'ET': 'ETB', // Ethiopia
  'MA': 'MAD', // Morocco
};
