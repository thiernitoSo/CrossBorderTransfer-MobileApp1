import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '../components/ui/Header';
import TabBar from '../components/ui/TabBar';
import BeneficiaryList from '../components/beneficiaries/BeneficiaryList';
import AddBeneficiaryForm from '../components/beneficiaries/AddBeneficiaryForm';
import ErrorMessage from '../components/ui/ErrorMessage';
import theme from '../constants/theme';
import beneficiaryService, { Beneficiary } from '../services/beneficiary';

export default function Beneficiaries() {
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: string; countryCode?: string }>();
  
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingBeneficiary, setIsAddingBeneficiary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if we should show the add form based on URL params
  useEffect(() => {
    if (params.action === 'add') {
      setIsAddingBeneficiary(true);
    }
  }, [params.action]);
  
  // Load beneficiaries
  useEffect(() => {
    loadBeneficiaries();
  }, []);
  
  const loadBeneficiaries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await beneficiaryService.getBeneficiaries();
      setBeneficiaries(data);
    } catch (error) {
      setError('Failed to load beneficiaries. Please try again.');
      console.error('Failed to load beneficiaries:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddBeneficiary = () => {
    setIsAddingBeneficiary(true);
  };
  
  const handleCancelAdd = () => {
    setIsAddingBeneficiary(false);
  };
  
  const handleBeneficiaryAdded = (beneficiary: Beneficiary) => {
    setBeneficiaries([...beneficiaries, beneficiary]);
    setIsAddingBeneficiary(false);
  };
  
  const handleBeneficiaryDeleted = (id: string) => {
    setBeneficiaries(beneficiaries.filter(b => b.id !== id));
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header
          title={isAddingBeneficiary ? "Add Beneficiary" : "Beneficiaries"}
          showBackButton={true}
        />
        
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}
        
        <ScrollView style={styles.scrollView}>
          {isAddingBeneficiary ? (
            <AddBeneficiaryForm
              onBeneficiaryAdded={handleBeneficiaryAdded}
              onCancel={handleCancelAdd}
              initialCountryCode={params.countryCode}
            />
          ) : (
            <>
              <View style={styles.headerContainer}>
                <Text style={styles.subtitle}>
                  Manage your recipients for sending money
                </Text>
              </View>
              
              <BeneficiaryList
                beneficiaries={beneficiaries}
                isLoading={isLoading}
                onRefresh={loadBeneficiaries}
                onDelete={handleBeneficiaryDeleted}
              />
            </>
          )}
        </ScrollView>
        
        {!isAddingBeneficiary && (
          <FAB
            style={styles.fab}
            icon="plus"
            color={theme.colors.surface}
            onPress={handleAddBeneficiary}
          />
        )}
        
        <TabBar />
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
  headerContainer: {
    padding: theme.spacing.lg,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: 80, // Above the tab bar
    backgroundColor: theme.colors.primary,
  },
});
