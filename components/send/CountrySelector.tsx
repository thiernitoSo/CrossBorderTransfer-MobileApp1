import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Text, Card, Searchbar } from 'react-native-paper';
import CountryFlag from '../ui/CountryFlag';
import { Country, africanCountries } from '../../constants/countries';
import theme from '../../constants/theme';
import { Feather } from '@expo/vector-icons';

interface CountrySelectorProps {
  selectedCountry: Country | null;
  onSelectCountry: (country: Country) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onSelectCountry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter countries based on search query
  const filteredCountries = africanCountries.filter(country => {
    const query = searchQuery.toLowerCase();
    return (
      country.name.toLowerCase().includes(query) ||
      country.currency.toLowerCase().includes(query) ||
      country.currencyCode.toLowerCase().includes(query)
    );
  });
  
  // Group countries by popular and others
  const popularCountries = filteredCountries.filter(country => country.popular);
  const otherCountries = filteredCountries.filter(country => !country.popular);

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        selectedCountry?.code === item.code && styles.selectedCountryItem,
      ]}
      onPress={() => onSelectCountry(item)}
    >
      <CountryFlag countryCode={item.code} size="medium" />
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.currencyText}>{item.currency}</Text>
      </View>
      {selectedCountry?.code === item.code && (
        <Feather name="check-circle" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search countries..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
      />
      
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {popularCountries.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Popular Destinations</Text>
              <FlatList
                data={popularCountries}
                renderItem={renderCountryItem}
                keyExtractor={(item) => item.code}
                scrollEnabled={false}
              />
            </View>
          )}
          
          {otherCountries.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>All Countries</Text>
              <FlatList
                data={otherCountries}
                renderItem={renderCountryItem}
                keyExtractor={(item) => item.code}
                scrollEnabled={false}
              />
            </View>
          )}
          
          {filteredCountries.length === 0 && (
            <View style={styles.emptyContainer}>
              <Feather name="search" size={40} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>No countries found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchBar: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  card: {
    borderRadius: theme.roundness.medium,
    backgroundColor: theme.colors.surface,
  },
  cardContent: {
    padding: 0,
  },
  sectionContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.textLight,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedCountryItem: {
    backgroundColor: theme.colors.primary + '10', // 10% opacity
  },
  countryInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  countryName: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  currencyText: {
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
  },
});

export default CountrySelector;
