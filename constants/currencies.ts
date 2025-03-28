import { africanCountries, sourceCountry } from './countries';

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

// Sample exchange rates from CAD to various African currencies
// In a production app, these would come from a real-time API
export const exchangeRates: ExchangeRate[] = [
  {
    from: 'CAD',
    to: 'GHS',
    rate: 8.42, 
    lastUpdated: new Date().toISOString(),
  },
  {
    from: 'CAD',
    to: 'NGN',
    rate: 550.75,
    lastUpdated: new Date().toISOString(),
  },
  {
    from: 'CAD',
    to: 'KES',
    rate: 94.82,
    lastUpdated: new Date().toISOString(),
  },
  {
    from: 'CAD',
    to: 'RWF',
    rate: 825.32,
    lastUpdated: new Date().toISOString(),
  },
  {
    from: 'CAD',
    to: 'XOF',
    rate: 438.26,
    lastUpdated: new Date().toISOString(),
  },
  {
    from: 'CAD',
    to: 'XAF',
    rate: 438.26,
    lastUpdated: new Date().toISOString(),
  },
  {
    from: 'CAD',
    to: 'ZAR',
    rate: 13.72,
    lastUpdated: new Date().toISOString(),
  },
  {
    from: 'CAD',
    to: 'TZS',
    rate: 1853.48,
    lastUpdated: new Date().toISOString(),
  },
  {
    from: 'CAD',
    to: 'UGX',
    rate: 2731.64,
    lastUpdated: new Date().toISOString(),
  },
  {
    from: 'CAD',
    to: 'ETB',
    rate: 41.95,
    lastUpdated: new Date().toISOString(),
  },
  {
    from: 'CAD',
    to: 'MAD',
    rate: 7.56,
    lastUpdated: new Date().toISOString(),
  },
];

// Transaction fee structure (5-6% as mentioned in the business plan)
export const feeStructure = {
  percentage: 0.055, // 5.5% fee
  minFee: 5, // Minimum fee in CAD
  maxFee: 50, // Maximum fee in CAD
};

// Get exchange rate for a specific currency pair
export const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
  const rate = exchangeRates.find(
    rate => rate.from === fromCurrency && rate.to === toCurrency
  );
  
  return rate ? rate.rate : 0;
};

// Calculate fee for a specific amount
export const calculateFee = (amount: number): number => {
  const fee = amount * feeStructure.percentage;
  
  if (fee < feeStructure.minFee) {
    return feeStructure.minFee;
  } else if (fee > feeStructure.maxFee) {
    return feeStructure.maxFee;
  }
  
  return parseFloat(fee.toFixed(2));
};

// Calculate total amount with fee
export const calculateTotalWithFee = (amount: number): number => {
  const fee = calculateFee(amount);
  return parseFloat((amount + fee).toFixed(2));
};

// Convert amount from one currency to another
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  const rate = getExchangeRate(fromCurrency, toCurrency);
  return parseFloat((amount * rate).toFixed(2));
};

// Get all available currencies
export const getAllCurrencies = (): string[] => {
  const currencies = africanCountries.map(country => country.currencyCode);
  currencies.push(sourceCountry.currencyCode);
  // Remove duplicates
  return [...new Set(currencies)];
};
