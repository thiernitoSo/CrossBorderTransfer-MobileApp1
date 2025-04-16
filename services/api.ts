import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSecureValue, SECURE_STORAGE_KEYS } from '../utils/storage';
import * as SecureStore from 'expo-secure-store';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Add request interceptor to include auth token in requests
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from secure storage
    const token = await getSecureValue(SECURE_STORAGE_KEYS.ACCESS_TOKEN);
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and not a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token
        const refreshToken = await getSecureValue(SECURE_STORAGE_KEYS.REFRESH_TOKEN);
        
        if (!refreshToken) {
          // No refresh token, logout user
          return Promise.reject(error);
        }
        
        // Attempt to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        
        // Save new tokens
        await SecureStore.setItemAsync(
          SECURE_STORAGE_KEYS.ACCESS_TOKEN,
          response.data.accessToken
        );
        await SecureStore.setItemAsync(
          SECURE_STORAGE_KEYS.REFRESH_TOKEN,
          response.data.refreshToken
        );
        
        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Token refresh failed, logout user
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Generic GET request
 */
export const get = async <T>(
  endpoint: string,
  params?: any
): Promise<T> => {
  try {
    const config: AxiosRequestConfig = { params };
    const response: AxiosResponse<T> = await apiClient.get(endpoint, config);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Generic POST request
 */
export const post = async <T>(
  endpoint: string,
  data?: any
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Generic PUT request
 */
export const put = async <T>(
  endpoint: string,
  data?: any
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient.put(endpoint, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Generic DELETE request
 */
export const del = async <T>(
  endpoint: string
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Handle API errors
 */
const handleApiError = (error: any): void => {
  let errorMessage = 'An unexpected error occurred';
  
  if (error.response) {
    // The server responded with an error status code
    const { status, data } = error.response;
    
    if (data.message) {
      errorMessage = data.message;
    } else if (status === 401) {
      errorMessage = 'Unauthorized: Please log in again';
    } else if (status === 403) {
      errorMessage = 'Forbidden: You do not have permission to access this resource';
    } else if (status === 404) {
      errorMessage = 'Not found: The requested resource could not be found';
    } else if (status === 422) {
      errorMessage = 'Validation error: Please check your input';
    } else if (status >= 500) {
      errorMessage = 'Server error: Please try again later';
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage = 'Network error: Please check your internet connection';
  }
  
  // Log error for debugging
  console.error('API Error:', {
    message: errorMessage,
    error: error,
  });
  
  // Attach better error message to the error object
  error.userMessage = errorMessage;
};

/**
 * API service for exporting all endpoints
 */
const apiService = {
  get,
  post,
  put,
  delete: del,
};

export default apiService;
