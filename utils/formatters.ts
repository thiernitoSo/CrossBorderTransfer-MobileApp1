/**
 * Format a currency amount with the appropriate currency symbol
 * 
 * @param amount Amount to format
 * @param currencyCode ISO currency code like "CAD", "USD", "NGN", etc.
 * @param options Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options: { 
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showCode?: boolean;
  } = {}
): string {
  const { 
    minimumFractionDigits = 2, 
    maximumFractionDigits = 2,
    showCode = false
  } = options;
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits,
      maximumFractionDigits,
      currencyDisplay: showCode ? 'code' : 'symbol',
    }).format(amount);
  } catch (error) {
    // Fallback in case currency code is not supported
    return `${currencyCode} ${amount.toFixed(minimumFractionDigits)}`;
  }
}

/**
 * Format a date string in a human-friendly format
 * 
 * @param dateString ISO date string to format
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  options: {
    includeTime?: boolean;
    format?: 'full' | 'short' | 'relative';
  } = {}
): string {
  const { includeTime = true, format = 'short' } = options;
  
  const date = new Date(dateString);
  
  if (format === 'relative') {
    return formatRelativeTime(date);
  }
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: format === 'full' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
  };
  
  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
  }
  
  return date.toLocaleDateString('en-US', dateOptions);
}

/**
 * Format a date as a relative time (e.g., "2 hours ago")
 * 
 * @param date Date to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date.toISOString(), { format: 'short' });
  }
}

/**
 * Format a phone number for display
 * 
 * @param phoneNumber Phone number to format
 * @param countryCode Country code
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string, countryCode?: string): string {
  // Implement different phone format based on country
  if (!phoneNumber) return '';
  
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Different formats for different countries
  if (countryCode === 'CA' || countryCode === 'US') {
    // Format for North America: (XXX) XXX-XXXX
    if (digits.length === 10) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    }
  } else if (countryCode === 'NG') {
    // Format for Nigeria: 0XXX XXX XXXX
    if (digits.length === 11 && digits.startsWith('0')) {
      return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
    }
  }
  
  // Default formatting: just add spaces every 4 digits
  if (digits.length >= 8) {
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }
  
  return phoneNumber;
}

/**
 * Truncate text to a specific length with ellipsis
 * 
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format a percentage value
 * 
 * @param value Value to format as percentage
 * @param decimalPlaces Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimalPlaces: number = 2): string {
  return `${(value * 100).toFixed(decimalPlaces)}%`;
}