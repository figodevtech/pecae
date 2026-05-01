import { Stack } from 'expo-router';
import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';

export default function SellerLayout() {
  return (
    <ProtectedRoute allowedRoles={['SELLER', 'BOTH']}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ title: 'Cadastro de Vendedor' }} />
        <Stack.Screen name="(seller-tabs)" options={{ title: 'Painel do Vendedor' }} />
        <Stack.Screen name="perfil-editar" options={{ title: 'Editar Perfil', presentation: 'modal' }} />
      </Stack>
    </ProtectedRoute>
  );
}
