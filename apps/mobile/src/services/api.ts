import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/auth-store';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para renovação automática de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma tentativa de refresh ou login
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;

      try {
        const { refreshToken, updateToken, clearAuth } = useAuthStore.getState();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { tokens } = response.data;
        
        // Atualiza tokens no store e no storage
        await updateToken(tokens.accessToken, tokens.refreshToken);

        // Atualiza o header da requisição original e tenta novamente
        originalRequest.headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Se falhar o refresh, desloga o usuário
        const { clearAuth } = useAuthStore.getState();
        await clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
