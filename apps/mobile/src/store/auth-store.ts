import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  updateToken: (accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

const TOKEN_KEY = 'pecae_auth_token';
const REFRESH_TOKEN_KEY = 'pecae_refresh_token';
const USER_KEY = 'pecae_user_data';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      
      // Update global API headers for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      set({ user, token: accessToken, refreshToken, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  },

  updateToken: async (accessToken, refreshToken) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      set({ token: accessToken, refreshToken });
    } catch (error) {
      console.error('Error updating tokens:', error);
    }
  },

  clearAuth: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      
      delete api.defaults.headers.common['Authorization'];
      
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  },

  initializeAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_KEY);

      if (token && userData) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ 
          user: JSON.parse(userData), 
          token, 
          refreshToken,
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      set({ isLoading: false });
    }
  },
}));
