import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Modal, Searchbar, Divider } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import theme from '../../constants/theme';
import { Country } from '../../constants/countries';

interface CountryPickerProps {
  visible: boolean;
  countries: Country[];
  onDismiss: () => void;
  onSelect: (country: Country) => void;
  title?: string;
}

const CountryPicker: React.FC<CountryPickerProps> = ({
  visible,
  countries,
  onDismiss,
  onSelect,
  title = 'Select Country',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleChangeSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => onSelect(item)}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <View style={styles.countryDetails}>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.countryCurrency}>{item.currency} ({item.currencyCode})</Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalContent}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Feather name="x" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      <Searchbar
        placeholder="Search countries"
        onChangeText={handleChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.textLight}
      />
      
      <FlatList
        data={filteredCountries}
        renderItem={renderCountryItem}
        keyExtractor={(item) => item.code}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.large,
    margin: theme.spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  searchBar: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  flag: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  countryDetails: {
    flex: 1,
  },
  countryName: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  countryCurrency: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
  },
  divider: {
    backgroundColor: theme.colors.border,
  },
});

export default CountryPicker;