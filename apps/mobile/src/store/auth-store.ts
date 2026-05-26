import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  name?: string;
  type?: string;
  role?: string;
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
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      
      set({ user, token: accessToken, refreshToken, isAuthenticated: true, isLoading: false });

      // Registrar o Push Token do dispositivo
      if (Platform.OS !== 'web') {
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus === 'granted') {
            const token = (await Notifications.getExpoPushTokenAsync()).data;
            // API interceptors usually handle the Authorization header
            // But we pass it explicitly just in case the interceptor is not ready yet
            await api.post('/users/push-token', {
              token,
              platform: Platform.OS,
            }, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            console.log('[AuthStore] Push token registered successfully');
          }
        } catch (pushErr) {
          console.error('[AuthStore] Failed to register push token:', pushErr);
        }
      }
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  },

  updateToken: async (accessToken, refreshToken) => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      
      set({ token: accessToken, refreshToken });
    } catch (error) {
      console.error('Error updating tokens:', error);
    }
  },

  clearAuth: async () => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  },

  initializeAuth: async () => {
    if (typeof window === 'undefined') return;
    
    // Evita re-inicialização e flashes de loading se já estiver logado
    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.user && state.token) {
      console.log('[AuthStore] ℹ️ Auth already initialized, skipping...');
      return;
    }
    
    console.log('[AuthStore] 🔄 Initializing Auth...');
    set({ isLoading: true });

    try {
      let token = null;
      let refreshToken = null;
      let userData = null;

      if (Platform.OS !== 'web') {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
        refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        userData = await SecureStore.getItemAsync(USER_KEY);
      } else {
        token = localStorage.getItem(TOKEN_KEY);
        refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        userData = localStorage.getItem(USER_KEY);
      }

      console.log(`[AuthStore] 🔍 Persistence: token=${!!token}, user=${!!userData}`);

      if (token && userData && userData !== 'undefined' && userData !== 'null') {
        try {
          const parsedUser = JSON.parse(userData);
          set({ 
            user: parsedUser, 
            token, 
            refreshToken,
            isAuthenticated: true, 
            isLoading: false 
          });
          console.log('[AuthStore] ✅ Session restored:', parsedUser.email);
        } catch (e) {
          console.error('[AuthStore] ❌ Error parsing user data:', e);
          set({ isLoading: false, isAuthenticated: false });
        }
      } else {
        console.log('[AuthStore] ℹ️ No session found in storage');
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      console.error('[AuthStore] 🚨 Critical error during auth initialization:', error);
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));

