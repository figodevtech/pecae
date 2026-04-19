import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth-store';

export default function Index() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    // Quando as tabs forem criadas, este será o destino principal
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/register" />;
}
