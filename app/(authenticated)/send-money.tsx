import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Formik } from 'formik';
import Header from '../../components/ui/Header';
import TabBar from '../../components/ui/TabBar';
import Button from '../../components/ui/Button';
import CountrySelector from '../../components/send/CountrySelector';
import CurrencyConverter from '../../components/send/CurrencyConverter';
import BeneficiarySelector from '../../components/send/BeneficiarySelector';
import FeeCalculator from '../../components/send/FeeCalculator';
import PaymentMethod from '../../components/send/PaymentMethod';
import ErrorMessage from '../../components/ui/ErrorMessage';
import theme from '../../constants/theme';
import { sendMoneySchema } from '../../utils/validation';
import { Country, getCountryByCode } from '../../constants/countries';
import { sourceCountry } from '../../constants/countries';
import { TransactionQuote } from '../../services/transaction';
import transactionService from '../../services/transaction';
import beneficiaryService, { Beneficiary } from '../../services/beneficiary';

export default function SendMoney() {
  const router = useRouter();
  const params = useLocalSearchParams<{ countryCode?: string; beneficiaryId?: string }>();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [transactionQuote, setTransactionQuote] = useState<TransactionQuote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load beneficiaries
    const loadBeneficiaries = async () => {
      try {
        const data = await beneficiaryService.getBeneficiaries();
        setBeneficiaries(data);
      } catch (error) {
        console.error('Failed to load beneficiaries:', error);
      }
    };

    loadBeneficiaries();
  }, []);

  useEffect(() => {
    // Set initial country or beneficiary from params
    if (params.countryCode) {
      const country = getCountryByCode(params.countryCode);
      if (country) setSelectedCountry(country);
    }

    if (params.beneficiaryId && beneficiaries.length > 0) {
      const beneficiary = beneficiaries.find(b => b.id === params.beneficiaryId);
      if (beneficiary) {
        setSelectedBeneficiary(beneficiary);
        const country = getCountryByCode(beneficiary.country);
        if (country) setSelectedCountry(country);
      }
    }
  }, [params.countryCode, params.beneficiaryId, beneficiaries]);

  const handleGetQuote = async (amount: number, destinationCurrency: string) => {
    try {
      setError(null);
      const quote = await transactionService.getTransactionQuote(
        amount,
        sourceCountry.currencyCode,
        destinationCurrency
      );
      setTransactionQuote(quote);
      return quote;
    } catch (error) {
      setError('Failed to get exchange rate. Please try again.');
      console.error('Failed to get quote:', error);
      return null;
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Create transaction
      const transaction = await transactionService.createTransaction({
        amount: values.amount,
        beneficiaryId: values.beneficiary,
        destinationCurrency: selectedCountry?.currencyCode || '',
        paymentMethod: values.paymentMethod,
        note: values.note,
      });

      // Navigate to success screen
      Alert.alert(
        'Transaction Initiated',
        `Your transaction of ${transaction.sourceAmount} ${transaction.sourceCurrency} to ${transaction.beneficiaryName} has been initiated.`,
        [
          {
            text: 'View Details',
            onPress: () => {
              router.push({
                pathname: '/(authenticated)/transactions',
                params: { transactionId: transaction.id }
              });
            },
          },
          { 
            text: 'Back to Home', 
            onPress: () => router.push('/(authenticated)/dashboard'),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      setError('Failed to process transaction. Please try again.');
      console.error('Transaction error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 4;
  const progress = currentStep / totalSteps;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header
          title="Send Money"
          showBackButton={true}
        />
        
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <Text style={styles.stepText}>Step {currentStep} of {totalSteps}</Text>
        </View>
        
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}
        
        <Formik
          initialValues={{
            destinationCountry: selectedCountry?.code || '',
            amount: '',
            beneficiary: selectedBeneficiary?.id || '',
            paymentMethod: 'card',
            note: '',
          }}
          validationSchema={sendMoneySchema}
          onSubmit={handleSubmit}
          enableReinitialize
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
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {currentStep === 1 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Select Destination</Text>
                  <CountrySelector
                    selectedCountry={selectedCountry}
                    onSelectCountry={(country) => {
                      setSelectedCountry(country);
                      setFieldValue('destinationCountry', country.code);
                    }}
                  />
                  
                  <View style={styles.buttonContainer}>
                    <Button
                      title="Next"
                      onPress={() => setCurrentStep(2)}
                      disabled={!selectedCountry}
                      fullWidth
                    />
                  </View>
                </View>
              )}
              
              {currentStep === 2 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Enter Amount</Text>
                  
                  <CurrencyConverter
                    sourceCurrency={sourceCountry.currencyCode}
                    destinationCurrency={selectedCountry?.currencyCode || ''}
                    onAmountChange={(amount) => {
                      setFieldValue('amount', amount);
                      handleGetQuote(
                        parseFloat(amount) || 0,
                        selectedCountry?.currencyCode || ''
                      );
                    }}
                    amount={values.amount}
                    error={touched.amount && errors.amount ? errors.amount : undefined}
                  />
                  
                  {transactionQuote && (
                    <FeeCalculator quote={transactionQuote} />
                  )}
                  
                  <View style={styles.buttonContainer}>
                    <Button
                      title="Back"
                      onPress={() => setCurrentStep(1)}
                      mode="outlined"
                      style={styles.backButton}
                    />
                    <Button
                      title="Next"
                      onPress={() => setCurrentStep(3)}
                      disabled={!values.amount || !!errors.amount}
                      style={styles.nextButton}
                    />
                  </View>
                </View>
              )}
              
              {currentStep === 3 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Select Beneficiary</Text>
                  
                  <BeneficiarySelector
                    beneficiaries={beneficiaries.filter(
                      b => b.country === selectedCountry?.code
                    )}
                    selectedBeneficiaryId={values.beneficiary}
                    onSelectBeneficiary={(id) => {
                      setFieldValue('beneficiary', id);
                      const selected = beneficiaries.find(b => b.id === id);
                      if (selected) setSelectedBeneficiary(selected);
                    }}
                    countryCode={selectedCountry?.code || ''}
                  />
                  
                  <View style={styles.buttonContainer}>
                    <Button
                      title="Back"
                      onPress={() => setCurrentStep(2)}
                      mode="outlined"
                      style={styles.backButton}
                    />
                    <Button
                      title="Next"
                      onPress={() => setCurrentStep(4)}
                      disabled={!values.beneficiary}
                      style={styles.nextButton}
                    />
                  </View>
                </View>
              )}
              
              {currentStep === 4 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Payment Method</Text>
                  
                  <PaymentMethod
                    selectedMethod={values.paymentMethod}
                    onSelectMethod={(method) => setFieldValue('paymentMethod', method)}
                  />
                  
                  <View style={styles.buttonContainer}>
                    <Button
                      title="Back"
                      onPress={() => setCurrentStep(3)}
                      mode="outlined"
                      style={styles.backButton}
                    />
                    <Button
                      title="Send Money"
                      onPress={() => handleSubmit()}
                      loading={isSubmitting}
                      disabled={!isValid || isSubmitting}
                      style={styles.nextButton}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </Formik>
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
  progressContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  stepText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  stepContainer: {
    padding: theme.spacing.lg,
  },
  stepTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
  },
  backButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  nextButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
});