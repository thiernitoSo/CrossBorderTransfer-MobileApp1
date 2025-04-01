import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Avatar, Card, TextInput, Switch, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Header from '../../components/ui/Header';
import TabBar from '../../components/ui/TabBar';
import Button from '../../components/ui/Button';
import ErrorMessage from '../../components/ui/ErrorMessage';
import theme from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const profileSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: Yup.string().required('Phone number is required'),
  address: Yup.string(),
  city: Yup.string(),
  province: Yup.string(),
  postalCode: Yup.string(),
});

type SettingsType = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  biometricAuth: boolean;
  darkMode: boolean;
};

export default function Profile() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'settings'
  
  const [settings, setSettings] = useState<SettingsType>({
    pushNotifications: true,
    emailNotifications: true,
    biometricAuth: false,
    darkMode: false,
  });
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };
  
  const handleProfileUpdate = async (values: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await updateUser({
        ...values,
        // Send profile image if we had one
        // profileImage: profileImage ? profileImage : undefined,
      });
      
      setIsEditing(false);
      Alert.alert('Success', 'Your profile has been updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/auth');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
    }
  };
  
  const toggleSetting = (setting: keyof SettingsType) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting],
    });
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header title="My Profile" />
        
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'profile' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('profile')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'profile' && styles.activeTabText,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'settings' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('settings')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'settings' && styles.activeTabText,
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'profile' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.profileHeader}>
              <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                {profileImage ? (
                  <Avatar.Image size={100} source={{ uri: profileImage }} />
                ) : (
                  <Avatar.Text
                    size={100}
                    label={user?.firstName?.charAt(0) + (user?.lastName?.charAt(0) || '')}
                    color="white"
                    style={styles.avatar}
                  />
                )}
                <View style={styles.editAvatarButton}>
                  <Feather name="camera" size={14} color="white" />
                </View>
              </TouchableOpacity>
              
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              
              {!isEditing && (
                <Button
                  title="Edit Profile"
                  icon="edit-2"
                  mode="outlined"
                  onPress={() => setIsEditing(true)}
                  style={styles.editButton}
                />
              )}
            </View>
            
            <Card style={styles.card}>
              <Card.Content>
                {isEditing ? (
                  <Formik
                    initialValues={{
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      email: user?.email || '',
                      phoneNumber: user?.phoneNumber || '',
                      address: user?.address || '',
                      city: user?.city || '',
                      province: user?.province || '',
                      postalCode: user?.postalCode || '',
                    }}
                    validationSchema={profileSchema}
                    onSubmit={handleProfileUpdate}
                  >
                    {({
                      handleChange,
                      handleBlur,
                      handleSubmit,
                      values,
                      errors,
                      touched,
                    }) => (
                      <View>
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        
                        <View style={styles.formRow}>
                          <View style={styles.formColumn}>
                            <TextInput
                              label="First Name"
                              value={values.firstName}
                              onChangeText={handleChange('firstName')}
                              onBlur={handleBlur('firstName')}
                              style={styles.input}
                              error={touched.firstName && !!errors.firstName}
                            />
                            {touched.firstName && errors.firstName && (
                              <Text style={styles.errorText}>{errors.firstName}</Text>
                            )}
                          </View>
                          
                          <View style={styles.formColumn}>
                            <TextInput
                              label="Last Name"
                              value={values.lastName}
                              onChangeText={handleChange('lastName')}
                              onBlur={handleBlur('lastName')}
                              style={styles.input}
                              error={touched.lastName && !!errors.lastName}
                            />
                            {touched.lastName && errors.lastName && (
                              <Text style={styles.errorText}>{errors.lastName}</Text>
                            )}
                          </View>
                        </View>
                        
                        <TextInput
                          label="Email"
                          value={values.email}
                          onChangeText={handleChange('email')}
                          onBlur={handleBlur('email')}
                          style={styles.input}
                          keyboardType="email-address"
                          error={touched.email && !!errors.email}
                        />
                        {touched.email && errors.email && (
                          <Text style={styles.errorText}>{errors.email}</Text>
                        )}
                        
                        <TextInput
                          label="Phone Number"
                          value={values.phoneNumber}
                          onChangeText={handleChange('phoneNumber')}
                          onBlur={handleBlur('phoneNumber')}
                          style={styles.input}
                          keyboardType="phone-pad"
                          error={touched.phoneNumber && !!errors.phoneNumber}
                        />
                        {touched.phoneNumber && errors.phoneNumber && (
                          <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                        )}
                        
                        <Text style={[styles.sectionTitle, styles.addressTitle]}>
                          Address Information
                        </Text>
                        
                        <TextInput
                          label="Address"
                          value={values.address}
                          onChangeText={handleChange('address')}
                          onBlur={handleBlur('address')}
                          style={styles.input}
                        />
                        
                        <View style={styles.formRow}>
                          <View style={styles.formColumn}>
                            <TextInput
                              label="City"
                              value={values.city}
                              onChangeText={handleChange('city')}
                              onBlur={handleBlur('city')}
                              style={styles.input}
                            />
                          </View>
                          
                          <View style={styles.formColumn}>
                            <TextInput
                              label="Province/State"
                              value={values.province}
                              onChangeText={handleChange('province')}
                              onBlur={handleBlur('province')}
                              style={styles.input}
                            />
                          </View>
                        </View>
                        
                        <TextInput
                          label="Postal Code"
                          value={values.postalCode}
                          onChangeText={handleChange('postalCode')}
                          onBlur={handleBlur('postalCode')}
                          style={[styles.input, styles.lastInput]}
                        />
                        
                        <View style={styles.formActions}>
                          <Button
                            title="Cancel"
                            onPress={() => setIsEditing(false)}
                            mode="outlined"
                            style={styles.cancelButton}
                          />
                          <Button
                            title="Save Changes"
                            onPress={() => handleSubmit()}
                            loading={isSubmitting}
                            style={styles.saveButton}
                          />
                        </View>
                      </View>
                    )}
                  </Formik>
                ) : (
                  <View>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Full Name</Text>
                      <Text style={styles.infoValue}>
                        {user?.firstName} {user?.lastName}
                      </Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{user?.email}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Phone</Text>
                      <Text style={styles.infoValue}>{user?.phoneNumber}</Text>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <Text style={styles.sectionTitle}>Address</Text>
                    
                    {user?.address ? (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Street</Text>
                          <Text style={styles.infoValue}>{user.address}</Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>City</Text>
                          <Text style={styles.infoValue}>{user.city}</Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Province</Text>
                          <Text style={styles.infoValue}>{user.province}</Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Postal Code</Text>
                          <Text style={styles.infoValue}>{user.postalCode}</Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.emptyText}>No address information</Text>
                    )}
                    
                    <Divider style={styles.divider} />
                    
                    <TouchableOpacity
                      style={styles.securityOption}
                      onPress={() => router.push('/(authenticated)/security')}
                    >
                      <Feather name="lock" size={20} color={theme.colors.text} />
                      <Text style={styles.securityText}>Security Settings</Text>
                      <Feather name="chevron-right" size={20} color={theme.colors.textLight} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.logoutButton}
                      onPress={handleLogout}
                    >
                      <Feather name="log-out" size={20} color={theme.colors.error} />
                      <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        )}
        
        {activeTab === 'settings' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Notifications</Text>
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Push Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Receive push notifications about transactions and important updates
                    </Text>
                  </View>
                  <Switch
                    value={settings.pushNotifications}
                    onValueChange={() => toggleSetting('pushNotifications')}
                    color={theme.colors.primary}
                  />
                </View>
                
                <Divider style={styles.settingDivider} />
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Email Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Receive email notifications about transactions and account activity
                    </Text>
                  </View>
                  <Switch
                    value={settings.emailNotifications}
                    onValueChange={() => toggleSetting('emailNotifications')}
                    color={theme.colors.primary}
                  />
                </View>
                
                <Text style={[styles.sectionTitle, styles.settingSectionTitle]}>
                  Security
                </Text>
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Biometric Authentication</Text>
                    <Text style={styles.settingDescription}>
                      Use fingerprint or face recognition to log in
                    </Text>
                  </View>
                  <Switch
                    value={settings.biometricAuth}
                    onValueChange={() => toggleSetting('biometricAuth')}
                    color={theme.colors.primary}
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => router.push('/(authenticated)/change-password')}
                >
                  <Text style={styles.settingButtonText}>Change Password</Text>
                  <Feather name="chevron-right" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                
                <Text style={[styles.sectionTitle, styles.settingSectionTitle]}>
                  Appearance
                </Text>
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Dark Mode</Text>
                    <Text style={styles.settingDescription}>
                      Switch between light and dark themes
                    </Text>
                  </View>
                  <Switch
                    value={settings.darkMode}
                    onValueChange={() => toggleSetting('darkMode')}
                    color={theme.colors.primary}
                  />
                </View>
                
                <Text style={[styles.sectionTitle, styles.settingSectionTitle]}>
                  About
                </Text>
                
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => router.push('/(authenticated)/help')}
                >
                  <Text style={styles.settingButtonText}>Help & Support</Text>
                  <Feather name="chevron-right" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => router.push('/(authenticated)/terms')}
                >
                  <Text style={styles.settingButtonText}>Terms & Conditions</Text>
                  <Feather name="chevron-right" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => router.push('/(authenticated)/privacy')}
                >
                  <Text style={styles.settingButtonText}>Privacy Policy</Text>
                  <Feather name="chevron-right" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                
                <Text style={styles.versionText}>
                  SendAfrika v1.0.0
                </Text>
              </Card.Content>
            </Card>
          </ScrollView>
        )}
        
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textLight,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  userName: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.bold,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  editButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.roundness.medium,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  addressTitle: {
    marginTop: theme.spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formColumn: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  formColumn2: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  input: {
    marginBottom: 8,
    backgroundColor: theme.colors.background,
  },
  lastInput: {
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.xs,
    marginTop: -4,
    marginBottom: theme.spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  saveButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    color: theme.colors.textLight,
    fontSize: theme.fontSizes.sm,
  },
  infoValue: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textLight,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
  },
  securityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  securityText: {
    flex: 1,
    marginLeft: theme.spacing.md,
    fontSize: theme.fontSizes.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  logoutText: {
    marginLeft: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.error,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.fontSizes.md,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
  },
  settingDivider: {
    marginBottom: theme.spacing.md,
  },
  settingSectionTitle: {
    marginTop: theme.spacing.lg,
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  settingButtonText: {
    fontSize: theme.fontSizes.md,
  },
  versionText: {
    textAlign: 'center',
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xl,
  },
});