import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';

export default function BuyerLayout() {
  const { colors, typography } = usePecaeTheme();
  const router = useRouter();

  return (
    <ProtectedRoute allowedRoles={['BUYER', 'BOTH', 'ADMIN', 'MODERATOR']}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontFamily: typography.heading,
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ padding: 8, marginLeft: -8 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
        }}
      >
        <Stack.Screen 
          name="perfil" 
          options={{ 
            title: 'Meu Perfil',
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="perfil-editar" 
          options={{ 
            title: 'Editar Perfil',
            presentation: 'modal',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="favoritos" 
          options={{ 
            title: 'Favoritos',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="buscas-salvas" 
          options={{ 
            title: 'Buscas Salvas',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="configuracoes" 
          options={{ 
            title: 'Configurações',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="configuracoes-notificacao" 
          options={{ 
            title: 'Notificações',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="compras" 
          options={{ 
            title: 'Minhas Compras',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="seguranca" 
          options={{ 
            title: 'Central de Segurança',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="ajuda" 
          options={{ 
            title: 'Ajuda',
            headerShown: true
          }} 
        />
      </Stack>
    </ProtectedRoute>
  );
}
