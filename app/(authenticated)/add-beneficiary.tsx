import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, HelperText, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import ErrorMessage from '../../components/ui/ErrorMessage';
import theme from '../../constants/theme';
import beneficiaryService, { CreateBeneficiaryData } from '../../services/beneficiary';
import { africanCountries, Country } from '../../constants/countries';
import CountryPicker from '../../components/ui/CountryPicker';

const paymentMethods = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cash_pickup', label: 'Cash Pickup' },
];

const relationships = [
  { label: 'Family', value: 'family' },
  { label: 'Friend', value: 'friend' },
  { label: 'Business', value: 'business' },
  { label: 'Other', value: 'other' },
];

// Schema for validation
const beneficiarySchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  country: Yup.string().required('Country is required'),
  phoneNumber: Yup.string().required('Phone number is required'),
  relationship: Yup.string().required('Relationship is required'),
  paymentMethod: Yup.string().required('Payment method is required'),
  accountNumber: Yup.string().when('paymentMethod', {
    is: 'bank',
    then: schema => schema.required('Account number is required'),
    otherwise: schema => schema
  }),
  bankName: Yup.string().when('paymentMethod', {
    is: 'bank',
    then: schema => schema.required('Bank name is required'),
    otherwise: schema => schema
  }),
  branchCode: Yup.string().when('paymentMethod', {
    is: 'bank',
    then: schema => schema,
    otherwise: schema => schema
  }),
  mobileMoneyProvider: Yup.string().when('paymentMethod', {
    is: 'mobile_money',
    then: schema => schema.required('Mobile money provider is required'),
    otherwise: schema => schema
  }),
});

export default function AddBeneficiary() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const formikRef = React.useRef(null);
  
  const initialValues: CreateBeneficiaryData = {
    firstName: '',
    lastName: '',
    country: '',
    phoneNumber: '',
    relationship: '',
    paymentMethod: 'bank',
    accountNumber: '',
    bankName: '',
    branchCode: '',
    mobileMoneyProvider: '',
  };
  
  const handleSubmit = async (values: CreateBeneficiaryData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create beneficiary
      const beneficiary = await beneficiaryService.createBeneficiary(values);
      
      // Show success alert
      Alert.alert(
        'Success',
        'Beneficiary added successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error adding beneficiary:', error);
      setError('Failed to add beneficiary. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  const handleSelectCountry = (formikProps: any, country: Country) => {
    formikProps.setFieldValue('country', country.code);
    setShowCountryPicker(false);
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header title="Add Beneficiary" showBackButton />
        
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}
        
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={beneficiarySchema}
            onSubmit={handleSubmit}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldValue,
            }) => (
              <View>
                <Text style={styles.sectionTitle}>Beneficiary Information</Text>
                
                <View style={styles.fieldRow}>
                  <View style={styles.fieldColumn}>
                    <TextInput
                      label="First Name"
                      value={values.firstName}
                      onChangeText={handleChange('firstName')}
                      onBlur={handleBlur('firstName')}
                      error={touched.firstName && !!errors.firstName}
                      style={styles.input}
                      mode="outlined"
                    />
                    {touched.firstName && errors.firstName && (
                      <HelperText type="error">{errors.firstName}</HelperText>
                    )}
                  </View>
                  
                  <View style={styles.fieldColumn}>
                    <TextInput
                      label="Last Name"
                      value={values.lastName}
                      onChangeText={handleChange('lastName')}
                      onBlur={handleBlur('lastName')}
                      error={touched.lastName && !!errors.lastName}
                      style={styles.input}
                      mode="outlined"
                    />
                    {touched.lastName && errors.lastName && (
                      <HelperText type="error">{errors.lastName}</HelperText>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={() => setShowCountryPicker(true)}
                  style={[
                    styles.countrySelector,
                    touched.country && !!errors.country && styles.inputError,
                  ]}
                >
                  <Text style={styles.countrySelectorLabel}>
                    Country
                  </Text>
                  <View style={styles.countryDisplay}>
                    <Text style={styles.countryText}>
                      {values.country 
                        ? africanCountries.find(c => c.code === values.country)?.name || values.country
                        : 'Select a country'}
                    </Text>
                    <Feather name="chevron-down" size={20} color={theme.colors.textLight} />
                  </View>
                </TouchableOpacity>
                {touched.country && errors.country && (
                  <HelperText type="error">{errors.country}</HelperText>
                )}
                
                <TextInput
                  label="Phone Number"
                  value={values.phoneNumber}
                  onChangeText={handleChange('phoneNumber')}
                  onBlur={handleBlur('phoneNumber')}
                  error={touched.phoneNumber && !!errors.phoneNumber}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="phone-pad"
                />
                {touched.phoneNumber && errors.phoneNumber && (
                  <HelperText type="error">{errors.phoneNumber}</HelperText>
                )}
                
                <Text style={styles.inputLabel}>Relationship</Text>
                <View style={styles.relationshipContainer}>
                  {relationships.map((relationship) => (
                    <TouchableOpacity
                      key={relationship.value}
                      style={[
                        styles.relationshipOption,
                        values.relationship === relationship.value && styles.relationshipSelected,
                      ]}
                      onPress={() => setFieldValue('relationship', relationship.value)}
                    >
                      <Text
                        style={[
                          styles.relationshipText,
                          values.relationship === relationship.value && styles.relationshipTextSelected,
                        ]}
                      >
                        {relationship.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {touched.relationship && errors.relationship && (
                  <HelperText type="error">{errors.relationship}</HelperText>
                )}
                
                <Text style={styles.sectionTitle}>Payment Details</Text>
                
                <Text style={styles.inputLabel}>Payment Method</Text>
                <RadioButton.Group
                  onValueChange={value => setFieldValue('paymentMethod', value)}
                  value={values.paymentMethod}
                >
                  {paymentMethods.map((method) => (
                    <View key={method.value} style={styles.radioOption}>
                      <RadioButton value={method.value} />
                      <Text style={styles.radioLabel}>{method.label}</Text>
                    </View>
                  ))}
                </RadioButton.Group>
                {touched.paymentMethod && errors.paymentMethod && (
                  <HelperText type="error">{errors.paymentMethod}</HelperText>
                )}
                
                {values.paymentMethod === 'bank' && (
                  <>
                    <TextInput
                      label="Bank Name"
                      value={values.bankName}
                      onChangeText={handleChange('bankName')}
                      onBlur={handleBlur('bankName')}
                      error={touched.bankName && !!errors.bankName}
                      style={styles.input}
                      mode="outlined"
                    />
                    {touched.bankName && errors.bankName && (
                      <HelperText type="error">{errors.bankName}</HelperText>
                    )}
                    
                    <TextInput
                      label="Account Number"
                      value={values.accountNumber}
                      onChangeText={handleChange('accountNumber')}
                      onBlur={handleBlur('accountNumber')}
                      error={touched.accountNumber && !!errors.accountNumber}
                      style={styles.input}
                      mode="outlined"
                    />
                    {touched.accountNumber && errors.accountNumber && (
                      <HelperText type="error">{errors.accountNumber}</HelperText>
                    )}
                    
                    <TextInput
                      label="Branch Code (Optional)"
                      value={values.branchCode}
                      onChangeText={handleChange('branchCode')}
                      onBlur={handleBlur('branchCode')}
                      error={touched.branchCode && !!errors.branchCode}
                      style={styles.input}
                      mode="outlined"
                    />
                    {touched.branchCode && errors.branchCode && (
                      <HelperText type="error">{errors.branchCode}</HelperText>
                    )}
                  </>
                )}
                
                {values.paymentMethod === 'mobile_money' && (
                  <>
                    <TextInput
                      label="Mobile Money Provider"
                      value={values.mobileMoneyProvider}
                      onChangeText={handleChange('mobileMoneyProvider')}
                      onBlur={handleBlur('mobileMoneyProvider')}
                      error={touched.mobileMoneyProvider && !!errors.mobileMoneyProvider}
                      style={styles.input}
                      mode="outlined"
                      placeholder="e.g. MTN, Orange, Airtel, M-Pesa"
                    />
                    {touched.mobileMoneyProvider && errors.mobileMoneyProvider && (
                      <HelperText type="error">{errors.mobileMoneyProvider}</HelperText>
                    )}
                    
                    <Text style={styles.note}>
                      Note: We'll send money to the phone number provided above.
                    </Text>
                  </>
                )}
                
                {values.paymentMethod === 'cash_pickup' && (
                  <Text style={styles.note}>
                    Your beneficiary will be able to collect cash at our partner locations
                    in {values.country ? africanCountries.find(c => c.code === values.country)?.name : 'the selected country'}.
                    We'll notify them when funds are ready for pickup.
                  </Text>
                )}
                
                <View style={styles.buttonContainer}>
                  <Button
                    title="Cancel"
                    onPress={handleCancel}
                    mode="outlined"
                    style={styles.cancelButton}
                  />
                  <Button
                    title="Save Beneficiary"
                    onPress={() => handleSubmit()}
                    loading={isSubmitting}
                    style={styles.submitButton}
                  />
                </View>
              </View>
            )}
          </Formik>
        </ScrollView>
        
        <CountryPicker
          visible={showCountryPicker}
          countries={africanCountries.filter(c => c.supported)}
          onDismiss={() => setShowCountryPicker(false)}
          onSelect={(country) => {
            // Use this approach since we're outside of the Formik render prop
            const formikProps = (formikRef as any).current;
            if (formikProps) {
              handleSelectCountry(formikProps, country);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldColumn: {
    width: '48%',
  },
  input: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputLabel: {
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.sm,
    color: theme.colors.textLight,
  },
  countrySelector: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  countrySelectorLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  countryDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryText: {
    fontSize: theme.fontSizes.md,
  },
  relationshipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  relationshipOption: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  relationshipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10', // 10% opacity
  },
  relationshipText: {
    color: theme.colors.text,
  },
  relationshipTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.medium,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  radioLabel: {
    marginLeft: theme.spacing.xs,
  },
  note: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
  },
  cancelButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  submitButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
});