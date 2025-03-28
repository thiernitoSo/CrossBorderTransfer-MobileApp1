import React from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Appbar, Text, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import theme from '../../constants/theme';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  showProfile?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  showLogo = false,
  showProfile = false,
  rightAction,
  transparent = false,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = () => {
    router.back();
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '?';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <SafeAreaView style={[styles.safeArea, transparent && styles.transparent]}>
      <StatusBar
        backgroundColor={transparent ? 'transparent' : theme.colors.primary}
        barStyle="light-content"
      />
      <Appbar.Header style={[styles.header, transparent && styles.transparentHeader]}>
        {showBackButton && (
          <Appbar.BackAction
            onPress={handleBack}
            color={transparent ? theme.colors.text : theme.colors.surface}
          />
        )}
        
        {showLogo && (
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>SendAfrika</Text>
          </View>
        )}
        
        <Text
          style={[
            styles.title,
            transparent ? styles.darkTitle : styles.lightTitle,
            showLogo && styles.hidden,
          ]}
        >
          {title}
        </Text>
        
        <View style={styles.rightContainer}>
          {rightAction}
          
          {showProfile && user && (
            <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
              <Avatar.Text
                size={32}
                label={getUserInitials()}
                style={styles.avatar}
                color={theme.colors.surface}
                theme={{ colors: { primary: theme.colors.secondary } }}
              />
            </TouchableOpacity>
          )}
        </View>
      </Appbar.Header>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.primary,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: theme.colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  transparentHeader: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    flex: 1,
  },
  lightTitle: {
    color: theme.colors.surface,
  },
  darkTitle: {
    color: theme.colors.text,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoText: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.surface,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    marginLeft: theme.spacing.sm,
  },
  avatar: {
    backgroundColor: theme.colors.secondary,
  },
  hidden: {
    opacity: 0,
  },
});

export default Header;
