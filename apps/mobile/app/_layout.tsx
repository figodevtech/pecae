import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import {
  useFonts,
  SpaceGrotesk_700Bold,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';
import {
  Manrope_400Regular,
  Manrope_500Medium,
} from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/auth-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

import { queryClient } from '../src/lib/queryClient';

export default function RootLayout() {
  const { initializeAuth, isLoading: isAuthLoading } = useAuthStore();
  const router = useRouter();
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_700Bold,
    SpaceGrotesk_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
  });

  useEffect(() => {
    initializeAuth();

    // Listener para notificações (clique)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Se a notificação tiver uma URL (ex: pecae://vehicle/123), navega para ela
      if (data?.url) {
        // Remove o esquema pecae:// se estiver presente para o router.push entender
        const path = data.url.replace('pecae://', '/');
        router.push(path);
      } else if (data?.type === 'CHAT' || data?.type === 'CHAT_MESSAGE') {
        router.push(`/chat/${data.roomId}`);
      } else if (data?.type === 'SAVED_SEARCH_ALERT') {
        router.push('/(tabs)/search');
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !isAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isAuthLoading]);

  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D' }} />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
