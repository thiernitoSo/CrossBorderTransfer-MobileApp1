import * as Yup from 'yup';

/**
 * Login form validation schema
 */
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

/**
 * Registration form validation schema
 */
export const registrationSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  phoneNumber: Yup.string()
    .matches(
      /^\+?[1-9]\d{9,14}$/,
      'Please enter a valid phone number'
    )
    .required('Phone number is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  agreedToTerms: Yup.boolean()
    .oneOf([true], 'You must agree to the terms and conditions')
    .required('You must agree to the terms and conditions'),
});

/**
 * Send money form validation schema
 */
export const sendMoneySchema = Yup.object().shape({
  destinationCountry: Yup.string()
    .required('Destination country is required'),
  amount: Yup.number()
    .min(10, 'Amount must be at least $10')
    .max(10000, 'Amount cannot exceed $10,000')
    .required('Amount is required'),
  beneficiary: Yup.string()
    .required('Beneficiary is required'),
  paymentMethod: Yup.string()
    .required('Payment method is required'),
  note: Yup.string()
    .max(100, 'Note cannot exceed 100 characters'),
});

/**
 * Add beneficiary form validation schema
 */
export const beneficiarySchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
  country: Yup.string()
    .required('Country is required'),
  phoneNumber: Yup.string()
    .matches(
      /^\+?[1-9]\d{9,14}$/,
      'Please enter a valid phone number'
    )
    .required('Phone number is required'),
  relationship: Yup.string()
    .required('Relationship is required'),
  paymentMethod: Yup.string()
    .required('Payment method is required'),
  accountNumber: Yup.string()
    .when('paymentMethod', {
      is: (val: string) => val === 'bank',
      then: Yup.string().required('Account number is required'),
    }),
  mobileMoneyProvider: Yup.string()
    .when('paymentMethod', {
      is: (val: string) => val === 'mobile_money',
      then: Yup.string().required('Mobile money provider is required'),
    }),
});

/**
 * Profile form validation schema
 */
export const profileSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  phoneNumber: Yup.string()
    .matches(
      /^\+?[1-9]\d{9,14}$/,
      'Please enter a valid phone number'
    )
    .required('Phone number is required'),
  address: Yup.string()
    .required('Address is required'),
  city: Yup.string()
    .required('City is required'),
  province: Yup.string()
    .required('Province is required'),
  postalCode: Yup.string()
    .matches(
      /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
      'Please enter a valid Canadian postal code'
    )
    .required('Postal code is required'),
});

/**
 * KYC form validation schema
 */
export const kycSchema = Yup.object().shape({
  documentType: Yup.string()
    .oneOf(['passport', 'drivers_license', 'national_id'], 'Invalid document type')
    .required('Document type is required'),
  documentNumber: Yup.string()
    .required('Document number is required'),
  dateOfBirth: Yup.date()
    .max(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), 'You must be at least 18 years old')
    .required('Date of birth is required'),
  nationality: Yup.string()
    .required('Nationality is required'),
  occupation: Yup.string()
    .required('Occupation is required'),
  sourceOfFunds: Yup.string()
    .required('Source of funds is required'),
  purposeOfTransfer: Yup.string()
    .required('Purpose of transfer is required'),
});

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, and one number
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/.test(password);
};

/**
 * Validate Canadian phone number
 */
export const isValidCanadianPhone = (phone: string): boolean => {
  return /^\+?1?\s*\(?(?:[2-9][0-9]{2})\)?[-.\s]?(?:[2-9][0-9]{2})[-.\s]?(?:[0-9]{4})$/.test(phone);
};

/**
 * Validate Canadian postal code
 */
export const isValidCanadianPostalCode = (postalCode: string): boolean => {
  return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(postalCode);
};
