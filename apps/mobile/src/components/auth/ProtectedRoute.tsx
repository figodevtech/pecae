import React, { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import { View, ActivityIndicator } from 'react-native';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * ProtectedRoute Component
 *
 * Enforces authentication and role-based access control.
 * If the user is not authenticated, redirects to login.
 * If the user does not have the required role, redirects to their default dashboard.
 *
 * Usa useRef para prevenir múltiplos redirects durante a inicialização do AuthStore
 * (race condition: isLoading=true → isAuthenticated muda → evita loop de redirects).
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Aguarda o AuthStore terminar de inicializar antes de qualquer decisão
    if (isLoading) return;

    // Reseta o flag quando o usuário se autentica com sucesso
    if (isAuthenticated) {
      hasRedirected.current = false;
      return;
    }

    // Redireciona ao login apenas uma vez por montagem
    if (!isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      console.log('[ProtectedRoute] 🔒 Not authenticated - redirecting to login');
      const timer = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !allowedRoles || !user) return;

    const userRole = user.type || 'BUYER';
    const isAllowed =
      allowedRoles.includes(userRole) || userRole === 'ADMIN' || userRole === 'BOTH';

    if (!isAllowed && !hasRedirected.current) {
      hasRedirected.current = true;
      console.log(`[ProtectedRoute] 🚫 Access denied: ${userRole}. Needed: ${allowedRoles}`);
      if (userRole === 'SELLER') {
        router.replace('/(seller)/(seller-tabs)');
      } else {
        router.replace('/(tabs)/');
      }
    }
  }, [isAuthenticated, user, isLoading, allowedRoles, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0D' }}>
        <ActivityIndicator size="large" color="#E5FF00" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <View style={{ flex: 1, backgroundColor: '#0D0D0D' }} />;
  }

  if (allowedRoles && user) {
    const userRole = user.type || 'BUYER';
    const isAllowed =
      allowedRoles.includes(userRole) || userRole === 'ADMIN' || userRole === 'BOTH';
    if (!isAllowed) {
      return <View style={{ flex: 1, backgroundColor: '#0D0D0D' }} />;
    }
  }

  return <>{children}</>;
}
