import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import CountryFlag from '../ui/CountryFlag';
import { Beneficiary } from '../../services/beneficiary';
import theme from '../../constants/theme';
import { Feather } from '@expo/vector-icons';

interface BeneficiarySelectorProps {
  beneficiaries: Beneficiary[];
  selectedBeneficiaryId: string;
  onSelectBeneficiary: (id: string) => void;
  countryCode: string;
}

const BeneficiarySelector: React.FC<BeneficiarySelectorProps> = ({
  beneficiaries,
  selectedBeneficiaryId,
  onSelectBeneficiary,
  countryCode,
}) => {
  const router = useRouter();

  const handleAddBeneficiary = () => {
    router.push({
      pathname: '/beneficiaries',
      params: { action: 'add', countryCode }
    });
  };

  const renderBeneficiaryItem = ({ item }: { item: Beneficiary }) => (
    <TouchableOpacity
      style={[
        styles.beneficiaryItem,
        selectedBeneficiaryId === item.id && styles.selectedBeneficiaryItem,
      ]}
      onPress={() => onSelectBeneficiary(item.id)}
    >
      <View style={styles.beneficiaryAvatar}>
        <Avatar.Text
          size={40}
          label={`${item.firstName.charAt(0)}${item.lastName.charAt(0)}`}
          color={theme.colors.surface}
          theme={{ colors: { primary: theme.colors.primary } }}
        />
        <CountryFlag
          countryCode={item.country}
          size="small"
          style={styles.flagOverlay}
        />
      </View>
      
      <View style={styles.beneficiaryInfo}>
        <Text style={styles.beneficiaryName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.beneficiaryDetails}>
          {item.paymentMethod === 'mobile_money'
            ? `Mobile Money: ${item.mobileMoneyProvider}`
            : item.paymentMethod === 'bank'
            ? `Bank Account: ${item.bankName}`
            : 'Cash Pickup'}
        </Text>
      </View>
      
      {selectedBeneficiaryId === item.id && (
        <Feather name="check-circle" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        {beneficiaries.length > 0 ? (
          <FlatList
            data={beneficiaries}
            renderItem={renderBeneficiaryItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="users" size={40} color={theme.colors.textLight} />
            <Text style={styles.emptyText}>No beneficiaries yet</Text>
            <Text style={styles.emptySubtext}>
              Add a beneficiary to send money to this country
            </Text>
          </View>
        )}
        
        <Button
          mode="outlined"
          onPress={handleAddBeneficiary}
          style={styles.addButton}
          icon="plus"
        >
          Add New Beneficiary
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.roundness.medium,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  beneficiaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedBeneficiaryItem: {
    backgroundColor: theme.colors.primary + '10', // 10% opacity
  },
  beneficiaryAvatar: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  flagOverlay: {
    position: 'absolute',
    bottom: -3,
    right: -3,
  },
  beneficiaryInfo: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  beneficiaryDetails: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  addButton: {
    marginTop: theme.spacing.md,
    borderColor: theme.colors.primary,
  },
});

export default BeneficiarySelector;
