import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import theme from '../../constants/theme';

interface TabItem {
  label: string;
  icon: string;
  route: string;
}

const TabBar: React.FC = () => {
  const router = useRouter();
  const currentPath = usePathname();

  const tabs: TabItem[] = [
    { label: 'Home', icon: 'home', route: '/(authenticated)/dashboard' },
    { label: 'Send', icon: 'send', route: '/(authenticated)/send-money' },
    { label: 'Beneficiaries', icon: 'users', route: '/(authenticated)/beneficiaries' },
    { label: 'History', icon: 'clock', route: '/(authenticated)/transactions' },
    { label: 'Profile', icon: 'user', route: '/(authenticated)/profile' },
  ];

  const handleTabPress = (route: string) => {
    router.push(route);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = currentPath === tab.route || 
                        (tab.route.includes(currentPath) && currentPath !== '/');
        
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            onPress={() => handleTabPress(tab.route)}
            activeOpacity={0.7}
          >
            <Feather
              name={tab.icon as any}
              size={20}
              color={isActive ? theme.colors.primary : theme.colors.textLight}
            />
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.activeTabLabel : styles.inactiveTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    height: 60,
    paddingBottom: theme.spacing.xs, // For devices with home indicator
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: 2, // Added for more dense tab layout
  },
  tabLabel: {
    fontSize: 10, // Reduced for more dense tab layout
    marginTop: 2,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
  },
  inactiveTabLabel: {
    color: theme.colors.textLight,
  },
});

export default TabBar;
