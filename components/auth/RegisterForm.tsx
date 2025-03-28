import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import { Formik } from 'formik';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import theme from '../../constants/theme';
import { registrationSchema } from '../../utils/validation';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      setGeneralError(null);
      
      // Extract needed fields and register
      const { confirmPassword, agreedToTerms, ...registerData } = values;
      await register(registerData);
    } catch (error) {
      // Error is already handled in the auth context
      setGeneralError(error.userMessage || 'Registration failed. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to start sending money with SendAfrika</Text>

        {generalError && (
          <ErrorMessage message={generalError} onDismiss={() => setGeneralError(null)} />
        )}

        <Formik
          initialValues={{
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            password: '',
            confirmPassword: '',
            agreedToTerms: false,
          }}
          validationSchema={registrationSchema}
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
            <View style={styles.form}>
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

              <Input
                label="Password"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password && errors.password ? errors.password : undefined}
                secureTextEntry
                leftIcon="lock"
              />

              <Input
                label="Confirm Password"
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={
                  touched.confirmPassword && errors.confirmPassword
                    ? errors.confirmPassword
                    : undefined
                }
                secureTextEntry
                leftIcon="lock"
              />

              <View style={styles.termsContainer}>
                <Checkbox.Android
                  status={values.agreedToTerms ? 'checked' : 'unchecked'}
                  onPress={() => setFieldValue('agreedToTerms', !values.agreedToTerms)}
                  color={theme.colors.primary}
                />
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                  {touched.agreedToTerms && errors.agreedToTerms && (
                    <Text style={styles.termsError}>{errors.agreedToTerms}</Text>
                  )}
                </View>
              </View>

              <Button
                title="Create Account"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={!(isValid && dirty)}
                fullWidth
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={onSwitchToLogin}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    width: '100%',
  },
  container: {
    width: '100%',
    paddingBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xl,
  },
  form: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: theme.spacing.md,
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.xs,
  },
  termsText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.medium,
  },
  termsError: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.xs,
    marginTop: theme.spacing.xs,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  loginText: {
    color: theme.colors.textLight,
    fontSize: theme.fontSizes.sm,
  },
  loginLink: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
});

export default RegisterForm;
