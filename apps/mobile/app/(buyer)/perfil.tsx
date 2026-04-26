import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePecaeTheme } from '../../src/theme';
import { useBuyerProfile } from '../../src/hooks/useBuyer';
import { useAuthStore } from '../../src/store/auth-store';

export default function PerfilComprador() {
  const { colors, typography, spacing, glassmorphism } = usePecaeTheme();
  const router = useRouter();
  const { data: profile, isLoading, error } = useBuyerProfile();
  const { clearAuth, user } = useAuthStore();

  const handleLogout = async () => {
    // A chamada de POST /auth/logout poderia estar no clearAuth, mas vamos apenas deslogar localmente por enquanto, ou chamar a API se precisarmos.
    await clearAuth();
    router.replace('/(auth)/login');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#050505' }]}>
        <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#050505' }]}>
        <Text style={[styles.errorText, { color: colors.danger, fontFamily: typography.primary }]}>
          Erro ao carregar perfil.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#050505' }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* Header Profile */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={[styles.avatar, { borderColor: colors.border }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="person" size={40} color={colors.textMuted} />
              </View>
            )}
            <TouchableOpacity 
              style={[styles.editAvatarBtn, { backgroundColor: colors.brand }]}
              onPress={() => router.push('/(buyer)/perfil-editar')}
            >
              <Ionicons name="pencil" size={14} color="#000" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.name, { color: colors.text, fontFamily: typography.primary }]}>
            {profile.name || 'Comprador'}
          </Text>
          <Text style={[styles.email, { color: colors.textMuted, fontFamily: typography.secondary }]}>
            {profile.email}
          </Text>

          {/* Badges de Verificação */}
          <View style={styles.badgesContainer}>
            {profile.emailVerified && (
              <View style={[styles.badge, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                <Text style={[styles.badgeText, { color: '#22c55e', fontFamily: typography.mono }]}>EMAIL VERIFICADO</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Grid */}
        <View style={styles.grid}>
          <TouchableOpacity 
            style={[styles.gridItem, glassmorphism.panel, { borderColor: colors.border }]}
            onPress={() => router.push('/(buyer)/favoritos')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
              <Ionicons name="heart" size={24} color={colors.brand} />
            </View>
            <Text style={[styles.gridText, { color: colors.text, fontFamily: typography.primary }]}>Favoritos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridItem, glassmorphism.panel, { borderColor: colors.border }]}
            // onPress={() => router.push('/(buyer)/chat')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
              <Ionicons name="chatbubbles" size={24} color="#38bdf8" />
            </View>
            <Text style={[styles.gridText, { color: colors.text, fontFamily: typography.primary }]}>Mensagens</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridItem, glassmorphism.panel, { borderColor: colors.border }]}
            onPress={() => router.push('/(buyer)/configuracoes')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
              <Ionicons name="settings" size={24} color="#a855f7" />
            </View>
            <Text style={[styles.gridText, { color: colors.text, fontFamily: typography.primary }]}>Configurações</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridItem, glassmorphism.panel, { borderColor: colors.border }]}
            onPress={() => router.push('/(buyer)/buscas-salvas')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Ionicons name="search" size={24} color="#22c55e" />
            </View>
            <Text style={[styles.gridText, { color: colors.text, fontFamily: typography.primary }]}>Buscas Salvas</Text>
          </TouchableOpacity>
        </View>

        {/* Seção Conta */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted, fontFamily: typography.primary }]}>CONTA</Text>
          
          {(user?.role === 'MODERATOR' || user?.role === 'ADMIN' || user?.type === 'MODERATOR' || user?.type === 'ADMIN') && (
            <TouchableOpacity 
              style={[styles.rowButton, { borderBottomColor: colors.border }]}
              onPress={() => router.push('/(moderator)')}
            >
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.brand} />
              <Text style={[styles.rowText, { color: colors.brand, fontFamily: typography.primary }]}>Painel de Moderação</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.brand} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.rowButton, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/(buyer)/perfil-editar')}
          >
            <Ionicons name="person-outline" size={22} color={colors.text} />
            <Text style={[styles.rowText, { color: colors.text, fontFamily: typography.primary }]}>Editar Dados Pessoais</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.rowButton, { borderBottomColor: colors.border }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
            <Text style={[styles.rowText, { color: colors.textMuted, fontFamily: typography.primary }]}>Sair da Conta</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.rowButton, { borderBottomColor: colors.border, marginTop: 16 }]}
            onPress={() => router.push('/(buyer)/excluir-conta')}
          >
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
            <Text style={[styles.rowText, { color: colors.danger, fontFamily: typography.primary }]}>Excluir Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#050505',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 32,
  },
  gridItem: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
  },
});
