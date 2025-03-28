import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, Card, RadioButton, Divider } from 'react-native-paper';
import { Formik } from 'formik';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';
import theme from '../../constants/theme';
import { kycSchema } from '../../utils/validation';
import * as ImagePicker from 'expo-image-picker';

interface KYCFormProps {
  onCancel: () => void;
}

interface KYCFormValues {
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documentNumber: string;
  dateOfBirth: Date;
  nationality: string;
  occupation: string;
  sourceOfFunds: string;
  purposeOfTransfer: string;
}

const KYCForm: React.FC<KYCFormProps> = ({ onCancel }) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  
  const initialValues: KYCFormValues = {
    documentType: 'passport',
    documentNumber: '',
    dateOfBirth: new Date(1990, 0, 1),
    nationality: 'CA',
    occupation: '',
    sourceOfFunds: '',
    purposeOfTransfer: '',
  };
  
  const sourceOfFundsOptions = [
    'Employment Income',
    'Business Income',
    'Savings',
    'Investment Returns',
    'Family Support',
    'Other',
  ];
  
  const purposeOfTransferOptions = [
    'Family Support',
    'Education Fees',
    'Medical Expenses',
    'Business',
    'Gift',
    'Other',
  ];
  
  const pickImage = async (setter: (uri: string) => void) => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to upload identification documents.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setter(result.assets[0].uri);
    }
  };
  
  const handleSubmit = async (values: KYCFormValues) => {
    try {
      setError(null);
      setIsSubmitting(true);
      
      // Check if all document images are uploaded
      if (!frontImage || !backImage || !selfieImage) {
        setError('Please upload all required document images.');
        setIsSubmitting(false);
        return;
      }
      
      // This would normally send the KYC data to the server
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Verification Submitted',
        'Your identity verification has been submitted for review. This process typically takes 1-2 business days.',
        [{ text: 'OK', onPress: onCancel }]
      );
    } catch (error) {
      setError('Failed to submit verification. Please try again.');
      console.error('KYC submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}
      
      <Formik
        initialValues={initialValues}
        validationSchema={kycSchema}
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
        }) => (
          <View style={styles.formContainer}>
            <Text style={styles.infoText}>
              To comply with financial regulations, we need to verify your identity before
              you can send large amounts of money. All information is encrypted and secure.
            </Text>
            
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Document Information</Text>
                
                <Text style={styles.label}>Document Type</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setFieldValue('documentType', 'passport')}
                  >
                    <RadioButton
                      value="passport"
                      status={values.documentType === 'passport' ? 'checked' : 'unchecked'}
                      onPress={() => setFieldValue('documentType', 'passport')}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.radioLabel}>Passport</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setFieldValue('documentType', 'drivers_license')}
                  >
                    <RadioButton
                      value="drivers_license"
                      status={values.documentType === 'drivers_license' ? 'checked' : 'unchecked'}
                      onPress={() => setFieldValue('documentType', 'drivers_license')}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.radioLabel}>Driver's License</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setFieldValue('documentType', 'national_id')}
                  >
                    <RadioButton
                      value="national_id"
                      status={values.documentType === 'national_id' ? 'checked' : 'unchecked'}
                      onPress={() => setFieldValue('documentType', 'national_id')}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.radioLabel}>National ID Card</Text>
                  </TouchableOpacity>
                </View>
                
                <Input
                  label="Document Number"
                  value={values.documentNumber}
                  onChangeText={handleChange('documentNumber')}
                  onBlur={handleBlur('documentNumber')}
                  error={touched.documentNumber && errors.documentNumber ? errors.documentNumber : undefined}
                  autoCapitalize="characters"
                />
                
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {values.dateOfBirth.toLocaleDateString()}
                  </Text>
                  <Feather name="calendar" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                {touched.dateOfBirth && errors.dateOfBirth && (
                  <Text style={styles.errorText}>{errors.dateOfBirth as string}</Text>
                )}
                
                {showDatePicker && (
                  <DateTimePicker
                    value={values.dateOfBirth}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setFieldValue('dateOfBirth', selectedDate);
                      }
                    }}
                    maximumDate={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000)} // 18 years ago
                  />
                )}
                
                <Input
                  label="Nationality"
                  value={values.nationality}
                  onChangeText={handleChange('nationality')}
                  onBlur={handleBlur('nationality')}
                  error={touched.nationality && errors.nationality ? errors.nationality : undefined}
                  autoCapitalize="words"
                />
              </Card.Content>
            </Card>
            
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Document Images</Text>
                
                <View style={styles.uploadSection}>
                  <Text style={styles.uploadLabel}>Front of ID Document</Text>
                  <TouchableOpacity
                    style={[styles.uploadButton, frontImage ? styles.uploadComplete : null]}
                    onPress={() => pickImage(setFrontImage)}
                  >
                    {frontImage ? (
                      <Feather name="check" size={24} color={theme.colors.success} />
                    ) : (
                      <Feather name="upload" size={24} color={theme.colors.primary} />
                    )}
                    <Text style={styles.uploadButtonText}>
                      {frontImage ? 'Uploaded' : 'Select Image'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.uploadSection}>
                  <Text style={styles.uploadLabel}>Back of ID Document</Text>
                  <TouchableOpacity
                    style={[styles.uploadButton, backImage ? styles.uploadComplete : null]}
                    onPress={() => pickImage(setBackImage)}
                  >
                    {backImage ? (
                      <Feather name="check" size={24} color={theme.colors.success} />
                    ) : (
                      <Feather name="upload" size={24} color={theme.colors.primary} />
                    )}
                    <Text style={styles.uploadButtonText}>
                      {backImage ? 'Uploaded' : 'Select Image'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.uploadSection}>
                  <Text style={styles.uploadLabel}>Selfie with ID Document</Text>
                  <TouchableOpacity
                    style={[styles.uploadButton, selfieImage ? styles.uploadComplete : null]}
                    onPress={() => pickImage(setSelfieImage)}
                  >
                    {selfieImage ? (
                      <Feather name="check" size={24} color={theme.colors.success} />
                    ) : (
                      <Feather name="upload" size={24} color={theme.colors.primary} />
                    )}
                    <Text style={styles.uploadButtonText}>
                      {selfieImage ? 'Uploaded' : 'Select Image'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
            
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                
                <Input
                  label="Occupation"
                  value={values.occupation}
                  onChangeText={handleChange('occupation')}
                  onBlur={handleBlur('occupation')}
                  error={touched.occupation && errors.occupation ? errors.occupation : undefined}
                />
                
                <Text style={styles.label}>Source of Funds</Text>
                <View style={styles.selectContainer}>
                  {sourceOfFundsOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.selectOption,
                        values.sourceOfFunds === option && styles.selectedOption,
                      ]}
                      onPress={() => setFieldValue('sourceOfFunds', option)}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          values.sourceOfFunds === option && styles.selectedOptionText,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {touched.sourceOfFunds && errors.sourceOfFunds && (
                  <Text style={styles.errorText}>{errors.sourceOfFunds}</Text>
                )}
                
                <Text style={styles.label}>Purpose of Transfers</Text>
                <View style={styles.selectContainer}>
                  {purposeOfTransferOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.selectOption,
                        values.purposeOfTransfer === option && styles.selectedOption,
                      ]}
                      onPress={() => setFieldValue('purposeOfTransfer', option)}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          values.purposeOfTransfer === option && styles.selectedOptionText,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {touched.purposeOfTransfer && errors.purposeOfTransfer && (
                  <Text style={styles.errorText}>{errors.purposeOfTransfer}</Text>
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
                title="Submit Verification"
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
  infoText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.info + '10', // 10% opacity
    padding: theme.spacing.md,
    borderRadius: theme.roundness.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
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
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.fontSizes.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.xs,
    marginBottom: theme.spacing.sm,
  },
  uploadSection: {
    marginVertical: theme.spacing.sm,
  },
  uploadLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    marginBottom: theme.spacing.xs,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.medium,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  uploadComplete: {
    borderStyle: 'solid',
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '10', // 10% opacity
  },
  uploadButtonText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.md,
  },
  divider: {
    marginVertical: theme.spacing.sm,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },
  selectOption: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.medium,
    padding: theme.spacing.sm,
    margin: theme.spacing.xs,
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10', // 10% opacity
  },
  selectOptionText: {
    fontSize: theme.fontSizes.sm,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.medium,
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

export default KYCForm;
