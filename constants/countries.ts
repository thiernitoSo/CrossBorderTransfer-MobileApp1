export interface Country {
  code: string;
  name: string;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  flag: string; // emoji flag
  popular: boolean;
  supported: boolean;
}

// African countries with their currency information
export const africanCountries: Country[] = [
  {
    code: 'GH',
    name: 'Ghana',
    currency: 'Ghanaian Cedi',
    currencyCode: 'GHS',
    currencySymbol: '₵',
    flag: '🇬🇭',
    popular: true,
    supported: true,
  },
  {
    code: 'NG',
    name: 'Nigeria',
    currency: 'Nigerian Naira',
    currencyCode: 'NGN',
    currencySymbol: '₦',
    flag: '🇳🇬',
    popular: true,
    supported: true,
  },
  {
    code: 'KE',
    name: 'Kenya',
    currency: 'Kenyan Shilling',
    currencyCode: 'KES',
    currencySymbol: 'KSh',
    flag: '🇰🇪',
    popular: true,
    supported: true,
  },
  {
    code: 'RW',
    name: 'Rwanda',
    currency: 'Rwandan Franc',
    currencyCode: 'RWF',
    currencySymbol: 'FRw',
    flag: '🇷🇼',
    popular: false,
    supported: true,
  },
  {
    code: 'SN',
    name: 'Senegal',
    currency: 'West African CFA Franc',
    currencyCode: 'XOF',
    currencySymbol: 'CFA',
    flag: '🇸🇳',
    popular: false,
    supported: true,
  },
  {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    currency: 'West African CFA Franc',
    currencyCode: 'XOF',
    currencySymbol: 'CFA',
    flag: '🇨🇮',
    popular: false,
    supported: true,
  },
  {
    code: 'CM',
    name: 'Cameroon',
    currency: 'Central African CFA Franc',
    currencyCode: 'XAF',
    currencySymbol: 'FCFA',
    flag: '🇨🇲',
    popular: false,
    supported: true,
  },
  {
    code: 'ZA',
    name: 'South Africa',
    currency: 'South African Rand',
    currencyCode: 'ZAR',
    currencySymbol: 'R',
    flag: '🇿🇦',
    popular: false,
    supported: true,
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    currency: 'Tanzanian Shilling',
    currencyCode: 'TZS',
    currencySymbol: 'TSh',
    flag: '🇹🇿',
    popular: false,
    supported: true,
  },
  {
    code: 'UG',
    name: 'Uganda',
    currency: 'Ugandan Shilling',
    currencyCode: 'UGX',
    currencySymbol: 'USh',
    flag: '🇺🇬',
    popular: false,
    supported: true,
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    currency: 'Ethiopian Birr',
    currencyCode: 'ETB',
    currencySymbol: 'Br',
    flag: '🇪🇹',
    popular: false,
    supported: true,
  },
  {
    code: 'MA',
    name: 'Morocco',
    currency: 'Moroccan Dirham',
    currencyCode: 'MAD',
    currencySymbol: 'DH',
    flag: '🇲🇦',
    popular: false,
    supported: true,
  },
];

// Source country (Canada)
export const sourceCountry: Country = {
  code: 'CA',
  name: 'Canada',
  currency: 'Canadian Dollar',
  currencyCode: 'CAD',
  currencySymbol: '$',
  flag: '🇨🇦',
  popular: true,
  supported: true,
};

// Get country by code
export const getCountryByCode = (code: string): Country | undefined => {
  if (code === 'CA') return sourceCountry;
  return africanCountries.find(country => country.code === code);
};

// Get popular destinations
export const getPopularDestinations = (): Country[] => {
  return africanCountries.filter(country => country.popular);
};
