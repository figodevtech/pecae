import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { useUnreadCount } from '../../src/hooks/useNotifications';
import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';
import { useAuthStore } from '../../src/store/auth-store';

export default function TabLayout() {
  const { colors, typography, effects } = usePecaeTheme();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count || 0;
  const { user } = useAuthStore();
  
  const isOnlyBuyer = user?.type === 'BUYER';

  return (
    <ProtectedRoute allowedRoles={['BUYER', 'BOTH']}>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: Platform.OS === 'ios' ? 88 : 70,
            paddingBottom: Platform.OS === 'ios' ? 30 : 10,
            paddingTop: 10,
            borderTopWidth: 1,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
          },
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelPosition: 'below-icon',
          tabBarLabelStyle: {
            fontFamily: typography.medium,
            fontSize: 10,
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Pesquisar',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sell-bridge"
          options={{
            title: 'Vender',
            href: isOnlyBuyer ? null : undefined,
            tabBarIcon: ({ focused }) => (
              <View style={[
                styles.sellIconContainer, 
                { backgroundColor: colors.brand, shadowColor: colors.brand }
              ]}>
                <Ionicons name="add" size={32} color="#FFF" />
              </View>
            ),
            tabBarLabelStyle: {
              display: 'none',
            },
          }}
        />
        <Tabs.Screen
          name="favoritos"
          options={{
            title: 'Favoritos',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "heart" : "heart-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            ),
          }}
        />
        
        {/* Hidden Screens */}
        <Tabs.Screen
          name="catalog"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="vehicle/[id]"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="notificacoes"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="mensagens"
          options={{ href: null }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  sellIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 4,
    borderColor: 'transparent', // Can be used for a ring effect if needed
  },
});

