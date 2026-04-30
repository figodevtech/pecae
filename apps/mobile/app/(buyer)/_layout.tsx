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
    <ProtectedRoute allowedRoles={['BUYER', 'BOTH']}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#050505',
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: typography.primary,
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ padding: 8, marginLeft: -8 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      >
        <Stack.Screen 
          name="perfil" 
          options={{ 
            title: 'Meu Perfil',
            headerShown: false // We will likely build a custom header for the main profile screen
          }} 
        />
        <Stack.Screen 
          name="perfil-editar" 
          options={{ 
            title: 'Editar Perfil',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="configuracoes" 
          options={{ 
            title: 'Configurações' 
          }} 
        />
        <Stack.Screen 
          name="compras" 
          options={{ 
            title: 'Minhas Compras',
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="seguranca" 
          options={{ 
            title: 'Central de Segurança',
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="ajuda" 
          options={{ 
            title: 'Ajuda',
            headerShown: false
          }} 
        />
      </Stack>
    </ProtectedRoute>
  );
}
