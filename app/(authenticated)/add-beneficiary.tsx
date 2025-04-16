import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '../../components/ui/Header';
import AddBeneficiaryForm from '../../components/beneficiaries/AddBeneficiaryForm';
import theme from '../../constants/theme';
import { Beneficiary } from '../../services/beneficiary';

export default function AddBeneficiary() {
  const router = useRouter();
  const params = useLocalSearchParams<{ countryCode?: string }>();
  const initialCountryCode = params.countryCode;
  
  const handleBeneficiaryAdded = (beneficiary: Beneficiary) => {
    Alert.alert(
      'Success',
      'Beneficiary has been added successfully',
      [
        {
          text: 'OK',
          onPress: () => {
            // If we were directed here from send money, go back to send money with the beneficiary
            if (initialCountryCode) {
              router.push({
                pathname: '/(authenticated)/send-money',
                params: {
                  countryCode: beneficiary.country,
                  beneficiaryId: beneficiary.id
                }
              });
            } else {
              // Otherwise, go back to the beneficiaries list
              router.push('/(authenticated)/beneficiaries');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header title="Add Beneficiary" showBackButton />
        
        <AddBeneficiaryForm
          onBeneficiaryAdded={handleBeneficiaryAdded}
          onCancel={handleCancel}
          initialCountryCode={initialCountryCode}
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
});