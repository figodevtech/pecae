import { useAuthStore } from './auth-store';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false, isLoading: false, refreshToken: null });
    jest.clearAllMocks();
  });

  it('[STORE-AUTH-01] AuthStore — setToken (setAuth) persiste o token', async () => {
    await useAuthStore.getState().setAuth({ id: 'user-1', email: 'test@test.com' }, 'jwt-abc-123', 'refresh-token');
    expect(useAuthStore.getState().token).toBe('jwt-abc-123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('pecae_auth_token', 'jwt-abc-123');
  });

  it('[STORE-AUTH-02] AuthStore — logout (clearAuth) limpa token e userData', async () => {
    useAuthStore.setState({ token: 'old-token', user: { id: 'user-1', email: 'test@test.com' } });
    await useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('pecae_auth_token');
  });

  it('[STORE-AUTH-03] AuthStore — restauração de sessão do storage', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === 'pecae_auth_token') return Promise.resolve('saved-jwt-token');
      if (key === 'pecae_refresh_token') return Promise.resolve('saved-refresh-token');
      if (key === 'pecae_user_data') return Promise.resolve(JSON.stringify({ id: 'user-2', email: 'restored@test.com' }));
      return Promise.resolve(null);
    });

    await useAuthStore.getState().initializeAuth();
    expect(useAuthStore.getState().token).toBe('saved-jwt-token');
    expect(useAuthStore.getState().user?.id).toBe('user-2');
  });
});
