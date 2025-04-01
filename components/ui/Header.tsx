import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import Drawer from './Drawer';
import theme from '../../constants/theme';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  showProfile?: boolean;
  onBackPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  showLogo = true,
  showProfile = true,
  onBackPress,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleProfilePress = () => {
    router.push('/(authenticated)/profile');
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBackPress}
            >
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleDrawerToggle}
            >
              <Feather name="menu" size={24} color="white" />
            </TouchableOpacity>
          )}

          {showLogo && !showBackButton && (
            <Text style={styles.logoText}>SendAfrika</Text>
          )}
        </View>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(authenticated)/notifications')}
          >
            <Feather name="bell" size={22} color="white" />
            <View style={styles.badge} />
          </TouchableOpacity>

          {showProfile && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              <Avatar.Text
                size={32}
                label={user?.firstName?.charAt(0) + (user?.lastName?.charAt(0) || '')}
                color="white"
                style={styles.avatar}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  iconButton: {
    padding: theme.spacing.xs,
    marginHorizontal: 2,
  },
  profileButton: {
    marginLeft: theme.spacing.xs,
  },
  avatar: {
    backgroundColor: theme.colors.primaryDark,
  },
  logoText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    color: 'white',
    marginLeft: theme.spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.notification,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
});

export default Header;