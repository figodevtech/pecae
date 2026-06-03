import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PecaeBackground, PecaeGlassCard, PecaeButton } from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth-store';

export default function ModeratorProfileScreen() {
  const { colors } = usePecaeTheme();
  const PecaeTokens = require('../../src/theme/pecae-tokens').PecaeTokens;
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Deseja encerrar a sessão de moderação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => useAuthStore.getState().clearAuth(),
        },
      ],
    );
  };

  const roleLabel = user?.type === 'ADMIN' ? 'Administrador' : 'Moderador';
  const roleIcon = user?.type === 'ADMIN' ? 'shield' : 'shield-checkmark';

  const menuItems = [
    { icon: 'shield-checkmark-outline', label: 'Segurança', action: () => {} },
    { icon: 'notifications-outline', label: 'Notificações', action: () => {} },
    { icon: 'settings-outline', label: 'Configurações', action: () => {} },
    { icon: 'help-buoy-outline', label: 'Suporte Técnico', action: () => {} },
  ];

  return (
    <PecaeBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.brand }]}>
            <Text style={[styles.avatarText, { color: colors.brand, fontFamily: PecaeTokens.typography.display }]}>
              {user?.name?.charAt(0)?.toUpperCase() || 'M'}
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.name, { color: colors.textPrimary, fontFamily: PecaeTokens.typography.heading }]}>
              {user?.name || 'Moderador'}
            </Text>
            <Text style={[styles.email, { color: colors.textMuted, fontFamily: PecaeTokens.typography.body }]}>
              {user?.email}
            </Text>
          </View>
        </View>

        {/* Badge de papel */}
        <PecaeGlassCard style={styles.roleCard} intensity={30}>
          <View style={styles.roleRow}>
            <View style={[styles.roleIconWrapper, { backgroundColor: 'rgba(63, 255, 139, 0.1)' }]}>
              <Ionicons name={roleIcon as any} size={22} color={colors.brand} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleTitle, { color: colors.textPrimary, fontFamily: PecaeTokens.typography.heading }]}>
                {roleLabel}
              </Text>
              <Text style={[styles.roleSubtitle, { color: colors.textMuted, fontFamily: PecaeTokens.typography.body }]}>
                Acesso ao painel de moderação PECAÊ
              </Text>
            </View>
            <View style={[styles.activeBadge, { backgroundColor: colors.brand }]}>
              <Text style={[styles.activeBadgeText, { color: '#000', fontFamily: PecaeTokens.typography.bold }]}>
                ATIVO
              </Text>
            </View>
          </View>
        </PecaeGlassCard>

        {/* Menu */}
        <PecaeGlassCard style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index !== menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={22} color={colors.brand} />
                <Text style={[styles.menuItemLabel, { color: colors.textPrimary, fontFamily: PecaeTokens.typography.medium }]}>
                  {item.label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </PecaeGlassCard>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: 'rgba(255, 80, 80, 0.4)', backgroundColor: 'rgba(255, 80, 80, 0.07)' }]}
          onPress={handleLogout}
          activeOpacity={0.75}
        >
          <Ionicons name="log-out-outline" size={20} color="#ff5050" />
          <Text style={[styles.logoutText, { color: '#ff5050', fontFamily: PecaeTokens.typography.bold }]}>
            SAIR DA CONTA
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 28,
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 20,
  },
  email: {
    fontSize: 13,
    marginTop: 3,
  },
  roleCard: {
    marginBottom: 20,
    padding: 16,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleInfo: {
    flex: 1,
    marginLeft: 14,
  },
  roleTitle: {
    fontSize: 16,
  },
  roleSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  menuCard: {
    padding: 0,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 14,
    letterSpacing: 1.5,
  },
});
