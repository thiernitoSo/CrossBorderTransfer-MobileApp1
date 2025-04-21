import apiService from './api';
import { saveSecureValue, deleteSecureValue, SECURE_STORAGE_KEYS, storeData, removeData, STORAGE_KEYS, getSecureValue } from '../utils/storage';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isVerified: boolean;
  createdAt: string;
  role?: 'user' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Login user
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    // Save tokens to secure storage
    await saveSecureValue(SECURE_STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    await saveSecureValue(SECURE_STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    
    // Save user data to storage
    await storeData(STORAGE_KEYS.USER_PROFILE, response.user);
    
    return response.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register new user
 */
export const register = async (userData: RegisterData): Promise<User> => {
  try {
    const response = await apiService.post<AuthResponse>('/auth/register', userData);
    
    // Save tokens to secure storage
    await saveSecureValue(SECURE_STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    await saveSecureValue(SECURE_STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    
    // Save user data to storage
    await storeData(STORAGE_KEYS.USER_PROFILE, response.user);
    
    return response.user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    // Call logout endpoint to invalidate tokens on server
    await apiService.post('/auth/logout');
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with local logout even if server request fails
  }
  
  try {
    // Remove tokens from secure storage
    await deleteSecureValue(SECURE_STORAGE_KEYS.ACCESS_TOKEN);
    await deleteSecureValue(SECURE_STORAGE_KEYS.REFRESH_TOKEN);
    
    // Remove user data from storage
    await removeData(STORAGE_KEYS.USER_PROFILE);
  } catch (error) {
    console.error('Local logout error:', error);
    throw error;
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    return await apiService.get<User>('/auth/user');
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (userData: Partial<User>): Promise<User> => {
  try {
    const updatedUser = await apiService.put<User>('/users/profile', userData);
    
    // Update local storage with new user data
    await storeData(STORAGE_KEYS.USER_PROFILE, updatedUser);
    
    return updatedUser;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await apiService.post('/auth/forgot-password', { email });
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<void> => {
  try {
    await apiService.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Change password (when logged in)
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    await apiService.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getSecureValue(SECURE_STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  changePassword,
  isAuthenticated,
};

export default authService;
