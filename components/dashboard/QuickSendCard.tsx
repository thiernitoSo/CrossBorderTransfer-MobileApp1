import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import CountryFlag from '../ui/CountryFlag';
import { getPopularDestinations } from '../../constants/countries';
import theme from '../../constants/theme';

interface QuickSendCardProps {
  recentBeneficiaries?: {
    id: string;
    name: string;
    country: string;
  }[];
}

const QuickSendCard: React.FC<QuickSendCardProps> = ({ recentBeneficiaries = [] }) => {
  const router = useRouter();
  const popularDestinations = getPopularDestinations();

  const handleSendToBeneficiary = (beneficiaryId: string) => {
    router.push({
      pathname: '/send-money',
      params: { beneficiaryId },
    });
  };

  const handleSendToCountry = (countryCode: string) => {
    router.push({
      pathname: '/send-money',
      params: { countryCode },
    });
  };

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <Text style={styles.title}>Quick Send</Text>
        
        {/* Recent beneficiaries */}
        {recentBeneficiaries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {recentBeneficiaries.map(beneficiary => (
                <TouchableOpacity
                  key={beneficiary.id}
                  style={styles.beneficiaryItem}
                  onPress={() => handleSendToBeneficiary(beneficiary.id)}
                >
                  <View style={styles.beneficiaryAvatar}>
                    <Avatar.Text
                      size={40}
                      label={beneficiary.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)}
                      color={theme.colors.surface}
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                    <CountryFlag
                      countryCode={beneficiary.country}
                      size="small"
                      style={styles.flagOverlay}
                    />
                  </View>
                  <Text style={styles.beneficiaryName} numberOfLines={1}>
                    {beneficiary.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Popular countries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {popularDestinations.map(country => (
              <TouchableOpacity
                key={country.code}
                style={styles.countryItem}
                onPress={() => handleSendToCountry(country.code)}
              >
                <CountryFlag countryCode={country.code} size="medium" />
                <Text style={styles.countryName} numberOfLines={1}>
                  {country.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.roundness.medium,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  scrollContent: {
    paddingRight: theme.spacing.md,
  },
  beneficiaryItem: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
    width: 60,
  },
  beneficiaryAvatar: {
    position: 'relative',
    marginBottom: theme.spacing.xs,
  },
  flagOverlay: {
    position: 'absolute',
    bottom: -3,
    right: -3,
  },
  beneficiaryName: {
    fontSize: theme.fontSizes.xs,
    textAlign: 'center',
  },
  countryItem: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
    width: 70,
  },
  countryName: {
    fontSize: theme.fontSizes.xs,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});

export default QuickSendCard;
