import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface UIState {
  viewMode: 'grid' | 'list';
  themeMode: 'light' | 'dark';
  
  setViewMode: (mode: 'grid' | 'list') => Promise<void>;
  setThemeMode: (mode: 'light' | 'dark') => Promise<void>;
  initializeUI: () => Promise<void>;
}

const VIEW_MODE_KEY = 'pecae_view_mode';
const THEME_MODE_KEY = 'pecae_theme_mode';

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'grid',
  themeMode: 'dark',

  setViewMode: async (mode) => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(VIEW_MODE_KEY, mode);
      } else {
        localStorage.setItem(VIEW_MODE_KEY, mode);
      }
      set({ viewMode: mode });
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  },

  setThemeMode: async (mode) => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(THEME_MODE_KEY, mode);
      } else {
        localStorage.setItem(THEME_MODE_KEY, mode);
      }
      set({ themeMode: mode });
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  },

  initializeUI: async () => {
    try {
      let viewMode: 'grid' | 'list' = 'grid';
      let themeMode: 'light' | 'dark' = 'dark';

      if (Platform.OS !== 'web') {
        const storedView = await SecureStore.getItemAsync(VIEW_MODE_KEY);
        const storedTheme = await SecureStore.getItemAsync(THEME_MODE_KEY);
        if (storedView === 'grid' || storedView === 'list') viewMode = storedView;
        if (storedTheme === 'light' || storedTheme === 'dark') themeMode = storedTheme;
      } else if (typeof window !== 'undefined') {
        const storedView = localStorage.getItem(VIEW_MODE_KEY);
        const storedTheme = localStorage.getItem(THEME_MODE_KEY);
        if (storedView === 'grid' || storedView === 'list') viewMode = storedView;
        if (storedTheme === 'light' || storedTheme === 'dark') themeMode = storedTheme;
      }

      set({ viewMode, themeMode });
    } catch (error) {
      console.error('Error initializing UI state:', error);
    }
  },
}));
