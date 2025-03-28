import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import authService, { User, LoginCredentials, RegisterData } from '../services/auth';
import { getData, storeData, STORAGE_KEYS, SECURE_STORAGE_KEYS } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if we have a token
        const token = await SecureStore.getItemAsync(SECURE_STORAGE_KEYS.ACCESS_TOKEN);
        
        if (token) {
          // Get cached user data
          const cachedUser = await getData<User>(STORAGE_KEYS.USER_PROFILE);
          
          if (cachedUser) {
            setUser(cachedUser);
          } else {
            // If no cached user data, fetch from API
            const userData = await authService.getCurrentUser();
            setUser(userData);
            await storeData(STORAGE_KEYS.USER_PROFILE, userData);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // If there's an error, clear the auth state to be safe
        await authService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await authService.login(credentials);
      setUser(userData);
      
      // Navigate to dashboard after login
      router.replace('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.userMessage || 'Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await authService.register(data);
      setUser(userData);
      
      // Navigate to dashboard after registration
      router.replace('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.userMessage || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.logout();
      setUser(null);
      
      // Navigate to auth screen after logout
      router.replace('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      setError(error.userMessage || 'Failed to update profile. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
