import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Text, Card, Divider, Menu, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import CountryFlag from '../ui/CountryFlag';
import { Beneficiary } from '../../services/beneficiary';
import beneficiaryService from '../../services/beneficiary';
import { getCountryByCode } from '../../constants/countries';
import theme from '../../constants/theme';
import { Feather } from '@expo/vector-icons';

interface BeneficiaryListProps {
  beneficiaries: Beneficiary[];
  isLoading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

const BeneficiaryList: React.FC<BeneficiaryListProps> = ({
  beneficiaries,
  isLoading,
  onRefresh,
  onDelete,
}) => {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
  const handleSendMoney = (beneficiary: Beneficiary) => {
    router.push({
      pathname: '/send-money',
      params: { beneficiaryId: beneficiary.id }
    });
  };
  
  const handleDeleteBeneficiary = async (beneficiary: Beneficiary) => {
    Alert.alert(
      'Delete Beneficiary',
      `Are you sure you want to delete ${beneficiary.firstName} ${beneficiary.lastName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await beneficiaryService.deleteBeneficiary(beneficiary.id);
              onDelete(beneficiary.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete beneficiary');
              console.error('Failed to delete beneficiary:', error);
            }
          },
        },
      ]
    );
  };
  
  const getPaymentMethodText = (beneficiary: Beneficiary) => {
    switch (beneficiary.paymentMethod) {
      case 'bank':
        return `Bank: ${beneficiary.bankName || 'N/A'}`;
      case 'mobile_money':
        return `Mobile Money: ${beneficiary.mobileMoneyProvider || 'N/A'}`;
      case 'cash_pickup':
        return 'Cash Pickup';
      default:
        return 'Unknown';
    }
  };
  
  const renderBeneficiaryItem = ({ item }: { item: Beneficiary }) => {
    const country = getCountryByCode(item.country);
    
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.headerRow}>
            <View style={styles.nameContainer}>
              <CountryFlag countryCode={item.country} size="small" style={styles.flag} />
              <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
            </View>
            
            <Menu
              visible={menuVisible === item.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setMenuVisible(item.id)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleSendMoney(item);
                }}
                title="Send Money"
                leadingIcon="send"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  // Edit functionality would go here
                  Alert.alert('Feature Not Available', 'Editing beneficiaries will be available soon');
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleDeleteBeneficiary(item);
                }}
                title="Delete"
                leadingIcon="trash-2"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Country</Text>
                <Text style={styles.detailValue}>{country?.name || item.country}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{item.phoneNumber}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>{getPaymentMethodText(item)}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Relationship</Text>
                <Text style={styles.detailValue}>{item.relationship}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => handleSendMoney(item)}
          >
            <Feather name="send" size={16} color={theme.colors.surface} />
            <Text style={styles.sendButtonText}>Send Money</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <FlatList
      data={beneficiaries}
      renderItem={renderBeneficiaryItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Feather name="users" size={50} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>No beneficiaries yet</Text>
          <Text style={styles.emptySubtext}>
            Add beneficiaries to send money to your loved ones
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness.medium,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    marginRight: theme.spacing.sm,
  },
  name: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
  },
  divider: {
    marginVertical: theme.spacing.sm,
  },
  detailsContainer: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    marginTop: 2,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness.medium,
  },
  sendButtonText: {
    color: theme.colors.surface,
    fontWeight: theme.fontWeights.semibold,
    marginLeft: theme.spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.textLight,
    marginTop: theme.spacing.lg,
  },
  emptySubtext: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default BeneficiaryList;
