import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth-store';

export default function ModeratorLayout() {
  const { colors, typography } = usePecaeTheme();
  const { user, isAuthenticated } = useAuthStore();

  // Proteção de Rota
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Verifica se o usuário é MODERATOR ou ADMIN
  const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN' || user?.type === 'MODERATOR' || user?.type === 'ADMIN';

  if (!isModerator) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: colors.border,
          height: 65,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: typography.heading,
          fontSize: 10,
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ANÚNCIOS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          title: 'DOCUMENTOS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
