import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, RadioButton } from 'react-native-paper';
import { Formik } from 'formik';
import { Feather } from '@expo/vector-icons';
import Input from '../ui/Input';
import Button from '../ui/Button';
import CountrySelector from '../send/CountrySelector';
import ErrorMessage from '../ui/ErrorMessage';
import { beneficiarySchema } from '../../utils/validation';
import theme from '../../constants/theme';
import beneficiaryService, { CreateBeneficiaryData, Beneficiary } from '../../services/beneficiary';
import { Country, getCountryByCode } from '../../constants/countries';

interface AddBeneficiaryFormProps {
  onBeneficiaryAdded: (beneficiary: Beneficiary) => void;
  onCancel: () => void;
  initialCountryCode?: string;
}

const AddBeneficiaryForm: React.FC<AddBeneficiaryFormProps> = ({
  onBeneficiaryAdded,
  onCancel,
  initialCountryCode,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(
    initialCountryCode ? getCountryByCode(initialCountryCode) || null : null
  );
  const [isCountrySelectorVisible, setIsCountrySelectorVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const initialValues: CreateBeneficiaryData = {
    firstName: '',
    lastName: '',
    country: initialCountryCode || '',
    phoneNumber: '',
    relationship: '',
    paymentMethod: 'mobile_money',
    mobileMoneyProvider: '',
  };
  
  const handleSubmit = async (values: CreateBeneficiaryData) => {
    try {
      setError(null);
      const newBeneficiary = await beneficiaryService.createBeneficiary(values);
      onBeneficiaryAdded(newBeneficiary);
    } catch (error) {
      setError('Failed to add beneficiary. Please try again.');
      console.error('Failed to add beneficiary:', error);
    }
  };
  
  const relationshipOptions = [
    { label: 'Family', value: 'family' },
    { label: 'Friend', value: 'friend' },
    { label: 'Business', value: 'business' },
    { label: 'Other', value: 'other' },
  ];
  
  const mobileMoneyProviders = [
    { label: 'Orange Money', value: 'orange_money' },
    { label: 'MTN Mobile Money', value: 'mtn_money' },
    { label: 'Airtel Money', value: 'airtel_money' },
    { label: 'M-Pesa', value: 'mpesa' },
  ];
  
  return (
    <ScrollView style={styles.container}>
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}
      
      <Formik
        initialValues={initialValues}
        validationSchema={beneficiarySchema}
        onSubmit={handleSubmit}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldValue,
          values,
          errors,
          touched,
          isValid,
          dirty,
          isSubmitting,
        }) => (
          <View style={styles.formContainer}>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                
                <View style={styles.nameRow}>
                  <Input
                    label="First Name"
                    value={values.firstName}
                    onChangeText={handleChange('firstName')}
                    onBlur={handleBlur('firstName')}
                    error={touched.firstName && errors.firstName ? errors.firstName : undefined}
                    style={styles.nameInput}
                    autoCapitalize="words"
                  />
                  
                  <Input
                    label="Last Name"
                    value={values.lastName}
                    onChangeText={handleChange('lastName')}
                    onBlur={handleBlur('lastName')}
                    error={touched.lastName && errors.lastName ? errors.lastName : undefined}
                    style={styles.nameInput}
                    autoCapitalize="words"
                  />
                </View>
                
                {isCountrySelectorVisible ? (
                  <View style={styles.countrySelectorContainer}>
                    <Text style={styles.label}>Select Country</Text>
                    <CountrySelector
                      selectedCountry={selectedCountry}
                      onSelectCountry={(country) => {
                        setSelectedCountry(country);
                        setFieldValue('country', country.code);
                        setIsCountrySelectorVisible(false);
                      }}
                    />
                    <Button
                      title="Cancel"
                      onPress={() => setIsCountrySelectorVisible(false)}
                      mode="outlined"
                      style={styles.cancelButton}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.countrySelector}
                    onPress={() => setIsCountrySelectorVisible(true)}
                  >
                    <Text style={styles.label}>Country</Text>
                    <View style={styles.selectedCountryContainer}>
                      {selectedCountry ? (
                        <View style={styles.selectedCountry}>
                          <Feather
                            name="map-pin"
                            size={16}
                            color={theme.colors.primary}
                            style={styles.icon}
                          />
                          <Text style={styles.countryName}>{selectedCountry.name}</Text>
                        </View>
                      ) : (
                        <Text style={styles.placeholderText}>Select Country</Text>
                      )}
                      <Feather name="chevron-right" size={20} color={theme.colors.textLight} />
                    </View>
                    {touched.country && errors.country && (
                      <Text style={styles.errorText}>{errors.country}</Text>
                    )}
                  </TouchableOpacity>
                )}
                
                <Input
                  label="Phone Number"
                  value={values.phoneNumber}
                  onChangeText={handleChange('phoneNumber')}
                  onBlur={handleBlur('phoneNumber')}
                  error={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : undefined}
                  keyboardType="phone-pad"
                  leftIcon="phone"
                />
                
                <Text style={styles.label}>Relationship</Text>
                <View style={styles.radioGroup}>
                  {relationshipOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.radioOption}
                      onPress={() => setFieldValue('relationship', option.value)}
                    >
                      <RadioButton
                        value={option.value}
                        status={values.relationship === option.value ? 'checked' : 'unchecked'}
                        onPress={() => setFieldValue('relationship', option.value)}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.radioLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {touched.relationship && errors.relationship && (
                  <Text style={styles.errorText}>{errors.relationship}</Text>
                )}
              </Card.Content>
            </Card>
            
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Payment Information</Text>
                
                <Text style={styles.label}>Payment Method</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setFieldValue('paymentMethod', 'mobile_money')}
                  >
                    <RadioButton
                      value="mobile_money"
                      status={values.paymentMethod === 'mobile_money' ? 'checked' : 'unchecked'}
                      onPress={() => setFieldValue('paymentMethod', 'mobile_money')}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.radioLabel}>Mobile Money</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setFieldValue('paymentMethod', 'bank')}
                  >
                    <RadioButton
                      value="bank"
                      status={values.paymentMethod === 'bank' ? 'checked' : 'unchecked'}
                      onPress={() => setFieldValue('paymentMethod', 'bank')}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.radioLabel}>Bank Transfer</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setFieldValue('paymentMethod', 'cash_pickup')}
                  >
                    <RadioButton
                      value="cash_pickup"
                      status={values.paymentMethod === 'cash_pickup' ? 'checked' : 'unchecked'}
                      onPress={() => setFieldValue('paymentMethod', 'cash_pickup')}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.radioLabel}>Cash Pickup</Text>
                  </TouchableOpacity>
                </View>
                
                {values.paymentMethod === 'mobile_money' && (
                  <>
                    <Text style={styles.label}>Mobile Money Provider</Text>
                    <View style={styles.radioGroup}>
                      {mobileMoneyProviders.map((provider) => (
                        <TouchableOpacity
                          key={provider.value}
                          style={styles.radioOption}
                          onPress={() => setFieldValue('mobileMoneyProvider', provider.value)}
                        >
                          <RadioButton
                            value={provider.value}
                            status={
                              values.mobileMoneyProvider === provider.value ? 'checked' : 'unchecked'
                            }
                            onPress={() => setFieldValue('mobileMoneyProvider', provider.value)}
                            color={theme.colors.primary}
                          />
                          <Text style={styles.radioLabel}>{provider.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {touched.mobileMoneyProvider && errors.mobileMoneyProvider && (
                      <Text style={styles.errorText}>{errors.mobileMoneyProvider}</Text>
                    )}
                  </>
                )}
                
                {values.paymentMethod === 'bank' && (
                  <>
                    <Input
                      label="Bank Name"
                      value={values.bankName || ''}
                      onChangeText={handleChange('bankName')}
                      onBlur={handleBlur('bankName')}
                      error={touched.bankName && errors.bankName ? errors.bankName : undefined}
                    />
                    
                    <Input
                      label="Account Number"
                      value={values.accountNumber || ''}
                      onChangeText={handleChange('accountNumber')}
                      onBlur={handleBlur('accountNumber')}
                      error={
                        touched.accountNumber && errors.accountNumber
                          ? errors.accountNumber
                          : undefined
                      }
                      keyboardType="numeric"
                    />
                    
                    <Input
                      label="Branch Code (Optional)"
                      value={values.branchCode || ''}
                      onChangeText={handleChange('branchCode')}
                      onBlur={handleBlur('branchCode')}
                      error={touched.branchCode && errors.branchCode ? errors.branchCode : undefined}
                    />
                  </>
                )}
              </Card.Content>
            </Card>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={onCancel}
                mode="outlined"
                style={styles.cancelButton}
              />
              <Button
                title="Add Beneficiary"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!(isValid && dirty)}
                style={styles.submitButton}
              />
            </View>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness.medium,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  radioGroup: {
    marginBottom: theme.spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  radioLabel: {
    fontSize: theme.fontSizes.md,
    marginLeft: theme.spacing.xs,
  },
  countrySelector: {
    marginVertical: theme.spacing.sm,
  },
  selectedCountryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.medium,
    padding: theme.spacing.md,
    marginTop: 4,
  },
  selectedCountry: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryName: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  placeholderText: {
    color: theme.colors.textLight,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.xs,
    marginTop: 4,
  },
  countrySelectorContainer: {
    marginVertical: theme.spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
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

export default AddBeneficiaryForm;
