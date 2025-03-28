import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Save data to AsyncStorage
 */
export const storeData = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Error storing data:', error);
    throw error;
  }
};

/**
 * Get data from AsyncStorage
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting data:', error);
    throw error;
  }
};

/**
 * Remove data from AsyncStorage
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing data:', error);
    throw error;
  }
};

/**
 * Save secure data (like auth tokens) to SecureStore
 */
export const saveSecureValue = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error saving secure value:', error);
    throw error;
  }
};

/**
 * Get secure data from SecureStore
 */
export const getSecureValue = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error getting secure value:', error);
    throw error;
  }
};

/**
 * Delete secure data from SecureStore
 */
export const deleteSecureValue = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error deleting secure value:', error);
    throw error;
  }
};

/**
 * Clear all data from AsyncStorage
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

// Keys for AsyncStorage
export const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  BENEFICIARIES: 'beneficiaries',
  RECENT_TRANSACTIONS: 'recent_transactions',
  SELECTED_COUNTRY: 'selected_country',
  APP_SETTINGS: 'app_settings',
  RECENT_COUNTRIES: 'recent_countries',
};

// Keys for SecureStore
export const SECURE_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_CREDENTIALS: 'user_credentials',
};
