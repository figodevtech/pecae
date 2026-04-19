import { useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { api } from '../services/api';

interface UseAppleAuthOptions {
  onSuccess: (data: { user: any; tokens: { accessToken: string; refreshToken: string } }) => void;
  onError: (message: string) => void;
}

export function useAppleAuth({ onSuccess, onError }: UseAppleAuthOptions) {
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    // Guard: Apple Sign-In is iOS-only
    if (Platform.OS !== 'ios') {
      onError('Apple Sign-In está disponível apenas em dispositivos iOS.');
      return;
    }

    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, fullName } = credential;

      if (!identityToken) {
        throw new Error('Apple não retornou um identity token.');
      }

      // Build full name string — Apple only provides this on the FIRST sign-in
      const resolvedName = [fullName?.givenName, fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim() || undefined;

      // Send to backend for validation and JWT issuance
      const response = await api.post('/auth/apple', {
        identityToken,
        fullName: resolvedName,
      });

      onSuccess(response.data);
    } catch (error: any) {
      // ERR_CANCELED = user dismissed the Apple auth sheet — not a real error
      if (error?.code === 'ERR_CANCELED') return;

      const message =
        error.response?.data?.message || 'Falha ao autenticar com Apple.';
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading };
}
