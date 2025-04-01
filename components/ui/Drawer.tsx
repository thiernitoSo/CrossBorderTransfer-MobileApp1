import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Divider, Avatar } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import theme from '../../constants/theme';

interface DrawerItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const mainMenuItems: DrawerItem[] = [
    { label: 'Dashboard', icon: 'home', route: '/(authenticated)/dashboard' },
    { label: 'Send Money', icon: 'send', route: '/(authenticated)/send-money' },
    { label: 'Beneficiaries', icon: 'users', route: '/(authenticated)/beneficiaries' },
    { label: 'Transaction History', icon: 'clock', route: '/(authenticated)/transactions' },
    { label: 'Support', icon: 'message-circle', route: '/support' },
  ];

  const accountMenuItems: DrawerItem[] = [
    { label: 'My Profile', icon: 'user', route: '/(authenticated)/profile' },
    { label: 'Settings', icon: 'settings', route: '/(authenticated)/settings' },
    { label: 'Notifications', icon: 'bell', route: '/(authenticated)/notifications', badge: 3 },
  ];

  const handleNavigation = (route: string) => {
    router.push(route);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/auth');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.overlayBg} onPress={onClose} />
      
      <View style={styles.drawer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Feather name="x" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.profileSection}
            onPress={() => handleNavigation('/(authenticated)/profile')}
          >
            <Avatar.Text 
              size={50} 
              label={user?.firstName?.charAt(0) + (user?.lastName?.charAt(0) || '')} 
              color="white" 
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Main Menu</Text>
            {mainMenuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
              >
                <View style={styles.menuItemContent}>
                  <Feather name={item.icon as any} size={20} color={theme.colors.text} />
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            {accountMenuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
              >
                <View style={styles.menuItemContent}>
                  <Feather name={item.icon as any} size={20} color={theme.colors.text} />
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : (
                  <Feather name="chevron-right" size={18} color={theme.colors.textLight} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <Divider style={styles.divider} />
          
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <View style={styles.menuItemContent}>
              <Feather name="log-out" size={20} color={theme.colors.error} />
              <Text style={[styles.menuItemLabel, styles.logoutText]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
        
        <View style={styles.footer}>
          <Text style={styles.version}>SendAfrika v1.0.0</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 1000,
  },
  overlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'column',
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  closeButton: {
    padding: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  profileInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  userName: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  userEmail: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.roundness.small,
  },
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: theme.fontSizes.md,
    marginLeft: theme.spacing.md,
  },
  badge: {
    backgroundColor: theme.colors.notification,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: theme.colors.background,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold,
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  logoutItem: {
    marginVertical: theme.spacing.lg,
  },
  logoutText: {
    color: theme.colors.error,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  version: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
  },
});

export default Drawer;