import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { api } from '../services/api';

// Required: complete the auth session when the browser redirects back
WebBrowser.maybeCompleteAuthSession();

interface UseGoogleAuthOptions {
  onSuccess: (data: { user: any; tokens: { accessToken: string; refreshToken: string } }) => void;
  onError: (message: string) => void;
}

export function useGoogleAuth({ onSuccess, onError }: UseGoogleAuthOptions) {
  const [loading, setLoading] = useState(false);

  const [, , promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    redirectUri: makeRedirectUri({
      // useProxy: true enables flow in Expo Go without custom URI scheme configured
      // When building a standalone app, set to false and configure the scheme
      useProxy: true,
    }),
    scopes: ['openid', 'profile', 'email'],
  });

  const signIn = async () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
      onError('Google Sign-In não está configurado. AWAITING_KEY.');
      return;
    }

    setLoading(true);
    try {
      const result = await promptAsync();

      if (result?.type !== 'success') {
        // User cancelled or flow was dismissed — not an error
        return;
      }

      // Exchange the authorization code for an idToken via Google's token endpoint
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: result.params.code,
          client_id: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
          redirect_uri: makeRedirectUri({ useProxy: true }),
          grant_type: 'authorization_code',
          code_verifier: result.params.code_verifier ?? '',
        }).toString(),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.id_token) {
        throw new Error('Falha ao obter ID token do Google.');
      }

      // Send idToken to our backend for validation and JWT issuance
      const response = await api.post('/auth/google', {
        idToken: tokenData.id_token,
      });

      onSuccess(response.data);
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Falha ao autenticar com Google.';
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading };
}
