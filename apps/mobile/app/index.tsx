import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth-store';

export default function Index() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return null; // Mantém a splash screen ou o fundo do RootLayout
  }

  if (isAuthenticated) {
    // Para usuários com ambos os papéis, o padrão agora é o Terminal (Comprador)
    // para evitar redirecionamentos indesejados relatados pelo usuário.
    if (user?.type === 'SELLER') {
      return <Redirect href="/(seller)/(seller-tabs)" />;
    }
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/(auth)/login" />;
}
