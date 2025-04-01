import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button as PaperButton, Dialog, Portal, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import TabBar from '../../components/ui/TabBar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorMessage from '../../components/ui/ErrorMessage';
import theme from '../../constants/theme';
import beneficiaryService, { Beneficiary } from '../../services/beneficiary';
import { getCountryByCode } from '../../constants/countries';

const BeneficiaryItem: React.FC<{
  beneficiary: Beneficiary;
  onPress: (beneficiary: Beneficiary) => void;
  onEdit: (beneficiary: Beneficiary) => void;
  onDelete: (beneficiary: Beneficiary) => void;
}> = ({ beneficiary, onPress, onEdit, onDelete }) => {
  const country = getCountryByCode(beneficiary.country);
  
  return (
    <Card style={styles.beneficiaryCard} onPress={() => onPress(beneficiary)}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.beneficiaryInfo}>
          <View style={styles.flagContainer}>
            <Text style={styles.flag}>{country?.flag || '🏳️'}</Text>
          </View>
          <View style={styles.details}>
            <Text style={styles.name}>
              {beneficiary.firstName} {beneficiary.lastName}
            </Text>
            <Text style={styles.location}>
              {country?.name || beneficiary.country}
            </Text>
            <View style={styles.methodContainer}>
              <Feather 
                name={
                  beneficiary.paymentMethod === 'bank' 
                    ? 'credit-card' 
                    : beneficiary.paymentMethod === 'mobile_money' 
                    ? 'smartphone' 
                    : 'map-pin'
                } 
                size={12} 
                color={theme.colors.textLight} 
              />
              <Text style={styles.method}>
                {beneficiary.paymentMethod === 'bank' 
                  ? 'Bank Account' 
                  : beneficiary.paymentMethod === 'mobile_money' 
                  ? 'Mobile Money' 
                  : 'Cash Pickup'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onEdit(beneficiary)}
          >
            <Feather name="edit" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onDelete(beneficiary)}
          >
            <Feather name="trash-2" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
};

export default function Beneficiaries() {
  const router = useRouter();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);

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
      console.error('Failed to load beneficiaries:', error);
      setError('Failed to load beneficiaries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBeneficiaryPress = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    router.push({
      pathname: '/(authenticated)/send-money',
      params: { 
        countryCode: beneficiary.country,
        beneficiaryId: beneficiary.id
      }
    });
  };

  const handleAddBeneficiary = () => {
    router.push('/(authenticated)/add-beneficiary');
  };

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    router.push({
      pathname: '/(authenticated)/edit-beneficiary',
      params: { id: beneficiary.id }
    });
  };

  const handleDeletePress = (beneficiary: Beneficiary) => {
    setDeleteId(beneficiary.id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    
    try {
      await beneficiaryService.deleteBeneficiary(deleteId);
      setBeneficiaries(prevBeneficiaries => 
        prevBeneficiaries.filter(b => b.id !== deleteId)
      );
      setShowDeleteDialog(false);
      setDeleteId(null);
      
      Alert.alert('Success', 'Beneficiary deleted successfully');
    } catch (error) {
      console.error('Failed to delete beneficiary:', error);
      setError('Failed to delete beneficiary. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeleteId(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header title="Beneficiaries" />
        
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {!isLoading && beneficiaries.length === 0 ? (
            <EmptyState
              icon="users"
              title="No Beneficiaries Yet"
              message="Add your first beneficiary to start sending money to your loved ones."
              actionLabel="Add Beneficiary"
              onAction={handleAddBeneficiary}
            />
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                Your Beneficiaries ({beneficiaries.length})
              </Text>
              
              {beneficiaries.map((beneficiary) => (
                <BeneficiaryItem
                  key={beneficiary.id}
                  beneficiary={beneficiary}
                  onPress={handleBeneficiaryPress}
                  onEdit={handleEditBeneficiary}
                  onDelete={handleDeletePress}
                />
              ))}
            </>
          )}
        </ScrollView>
        
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={handleAddBeneficiary}
          label="Add Beneficiary"
        />
        
        <Portal>
          <Dialog visible={showDeleteDialog} onDismiss={handleDeleteCancel}>
            <Dialog.Title>Delete Beneficiary</Dialog.Title>
            <Dialog.Content>
              <Text>
                Are you sure you want to delete this beneficiary? This action cannot be undone.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <PaperButton onPress={handleDeleteCancel}>Cancel</PaperButton>
              <PaperButton onPress={handleDeleteConfirm} textColor={theme.colors.error}>
                Delete
              </PaperButton>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        
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
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 80, // Space for FAB
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.md,
  },
  beneficiaryCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness.medium,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  beneficiaryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  flag: {
    fontSize: 24,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  location: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  method: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: 70, // Position above tab bar
    backgroundColor: theme.colors.primary,
  },
});