import React, { useEffect } from 'react';
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
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('[ProtectedRoute] User not authenticated, redirecting to login');
        router.replace('/(auth)/login');
      } else if (allowedRoles && user) {
        const userRole = user.type || 'BUYER';
        const isAllowed = allowedRoles.includes(userRole) || userRole === 'ADMIN' || userRole === 'BOTH';
        
        if (!isAllowed) {
          console.log(`[ProtectedRoute] Access denied for role: ${userRole}. Allowed: ${allowedRoles}`);
          // Redirect to appropriate home based on their actual role
          if (userRole === 'SELLER') {
            router.replace('/(seller)/(tabs)');
          } else {
            router.replace('/(tabs)/');
          }
        }
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
    return null;
  }

  if (allowedRoles && user) {
    const userRole = user.type || 'BUYER';
    const isAllowed = allowedRoles.includes(userRole) || userRole === 'ADMIN' || userRole === 'BOTH';
    if (!isAllowed) return null;
  }

  return <>{children}</>;
}
