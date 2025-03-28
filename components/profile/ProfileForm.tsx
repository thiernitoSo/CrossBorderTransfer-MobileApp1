import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Formik } from 'formik';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import theme from '../../constants/theme';
import { profileSchema } from '../../utils/validation';

interface ProfileFormProps {
  onCancel: () => void;
}

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onCancel }) => {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialValues: ProfileFormValues = {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    city: user?.city || '',
    province: user?.province || '',
    postalCode: user?.postalCode || '',
  };
  
  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      setError(null);
      setIsSubmitting(true);
      
      await updateUser(values);
      onCancel(); // Return to profile overview on success
    } catch (error) {
      setError('Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
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
        validationSchema={profileSchema}
        onSubmit={handleSubmit}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          isValid,
          dirty,
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
                
                <Input
                  label="Email"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  error={touched.email && errors.email ? errors.email : undefined}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail"
                />
                
                <Input
                  label="Phone Number"
                  value={values.phoneNumber}
                  onChangeText={handleChange('phoneNumber')}
                  onBlur={handleBlur('phoneNumber')}
                  error={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : undefined}
                  keyboardType="phone-pad"
                  leftIcon="phone"
                />
              </Card.Content>
            </Card>
            
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Canadian Address</Text>
                
                <Input
                  label="Street Address"
                  value={values.address}
                  onChangeText={handleChange('address')}
                  onBlur={handleBlur('address')}
                  error={touched.address && errors.address ? errors.address : undefined}
                  leftIcon="home"
                />
                
                <View style={styles.locationRow}>
                  <Input
                    label="City"
                    value={values.city}
                    onChangeText={handleChange('city')}
                    onBlur={handleBlur('city')}
                    error={touched.city && errors.city ? errors.city : undefined}
                    style={styles.cityInput}
                  />
                  
                  <Input
                    label="Province"
                    value={values.province}
                    onChangeText={handleChange('province')}
                    onBlur={handleBlur('province')}
                    error={touched.province && errors.province ? errors.province : undefined}
                    style={styles.provinceInput}
                  />
                </View>
                
                <Input
                  label="Postal Code"
                  value={values.postalCode}
                  onChangeText={handleChange('postalCode')}
                  onBlur={handleBlur('postalCode')}
                  error={touched.postalCode && errors.postalCode ? errors.postalCode : undefined}
                  autoCapitalize="characters"
                />
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
                title="Save Changes"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!(isValid && dirty)}
                style={styles.saveButton}
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
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cityInput: {
    flex: 2,
    marginRight: theme.spacing.sm,
  },
  provinceInput: {
    flex: 1,
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
  saveButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
});

export default ProfileForm;
