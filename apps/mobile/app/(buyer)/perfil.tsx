import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePecaeTheme } from '../../src/theme';
import { useBuyerProfile } from '../../src/hooks/useBuyer';
import { useAuthStore } from '../../src/store/auth-store';
import { useUIStore } from '../../src/store/ui-store';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';

export default function PerfilCompradorMenu() {
  const { colors, typography, spacing, effects, isDark } = usePecaeTheme();
  const router = useRouter();
  const { data: profile, isLoading } = useBuyerProfile();
  const { clearAuth, user } = useAuthStore();
  const { themeMode, setThemeMode } = useUIStore();

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/(auth)/login');
  };

  const toggleTheme = async () => {
    const newTheme = themeMode === 'dark' ? 'light' : 'dark';
    await setThemeMode(newTheme);
  };

  const handleBack = () => {
    if (Platform.OS === 'web') {
      router.replace('/(tabs)');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  if (isLoading) {
    return (
      <PecaeBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        </SafeAreaView>
      </PecaeBackground>
    );
  }

  return (
    <PecaeBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Custom Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleBack}
              style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
              MEU PERFIL
            </Text>
            <View style={{ width: 44 }} />
          </View>
          
          {/* Hero Profile Section */}
          <View style={styles.heroSection}>
            <View style={styles.avatarWrapper}>
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={[styles.avatar, { borderColor: colors.brand }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="person" size={42} color={colors.brand} />
                </View>
              )}
              <TouchableOpacity 
                style={[styles.editAvatarBtn, { backgroundColor: colors.brand, borderColor: isDark ? '#000' : '#fff' }]}
                onPress={() => router.push('/(buyer)/perfil-editar')}
              >
                <Ionicons name="camera" size={14} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.heroInfo}>
              <Text style={[styles.name, { color: colors.textPrimary, fontFamily: typography.display }]}>
                {profile?.name || user?.name || 'Comprador PECAÊ'}
              </Text>
              <Text style={[styles.email, { color: colors.textMuted, fontFamily: typography.body }]}>
                {profile?.email || user?.email}
              </Text>
              <View style={styles.badgeContainer}>
                <View style={[styles.roleBadge, { backgroundColor: colors.brand + '20', borderColor: colors.brand + '40' }]}>
                  <Text style={[styles.roleText, { color: colors.brand, fontFamily: typography.mono }]}>COMPRADOR</Text>
                </View>
                {user?.isVerified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: '#22c55e20', borderColor: '#22c55e40' }]}>
                    <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                    <Text style={[styles.verifiedText, { color: '#22c55e', fontFamily: typography.mono }]}>VERIFICADO</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Quick Settings Card */}
          <View style={styles.section}>
            <PecaeGlassCard style={styles.glassCard} intensity={isDark ? 10 : 40}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelGroup}>
                  <View style={[styles.iconBox, { backgroundColor: colors.brand + '15' }]}>
                    <Ionicons 
                      name={themeMode === 'dark' ? 'moon' : 'sunny'} 
                      size={20} 
                      color={colors.brand} 
                    />
                  </View>
                  <Text style={[styles.cardLabel, { color: colors.textPrimary, fontFamily: typography.medium }]}>
                    Modo Escuro
                  </Text>
                </View>
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#CBD5E1', true: colors.brand }}
                  thumbColor={isDark ? colors.brand : '#fff'}
                />
              </View>
            </PecaeGlassCard>
          </View>

          {/* Navigation Groups */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.display }]}>
              MINHA ATIVIDADE
            </Text>
            
            <PecaeGlassCard style={styles.menuGroup} intensity={isDark ? 15 : 35}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(buyer)/favoritos')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#f43f5e15' }]}>
                  <Ionicons name="heart" size={18} color="#f43f5e" />
                </View>
                <Text style={[styles.menuItemText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                  Anúncios Salvos
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(buyer)/buscas-salvas')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#3b82f615' }]}>
                  <Ionicons name="search" size={18} color="#3b82f6" />
                </View>
                <Text style={[styles.menuItemText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                  Buscas Salvas
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(buyer)/negociacoes')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: colors.brand + '15' }]}>
                  <Ionicons name="chatbubbles" size={18} color={colors.brand} />
                </View>
                <Text style={[styles.menuItemText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                  Minhas Negociações
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </PecaeGlassCard>
          </View>

          {/* Account & Security */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.display }]}>
              SEGURANÇA E AJUDA
            </Text>
            
            <PecaeGlassCard style={styles.menuGroup} intensity={isDark ? 15 : 35}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(buyer)/perfil-editar')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: colors.brand + '15' }]}>
                  <Ionicons name="person-circle" size={18} color={colors.brand} />
                </View>
                <Text style={[styles.menuItemText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                  Editar Perfil
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(buyer)/seguranca')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#6366f115' }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#6366f1" />
                </View>
                <Text style={[styles.menuItemText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                  Central de Segurança
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(buyer)/configuracoes')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#94a3b815' }]}>
                  <Ionicons name="settings" size={18} color="#94a3b8" />
                </View>
                <Text style={[styles.menuItemText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                  Configurações
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(buyer)/ajuda')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: '#f59e0b15' }]}>
                  <Ionicons name="help-circle" size={18} color="#f59e0b" />
                </View>
                <Text style={[styles.menuItemText, { color: colors.textPrimary, fontFamily: typography.body }]}>
                  Suporte e FAQ
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </PecaeGlassCard>
          </View>

          {/* Moderator Panel Link */}
          {(user?.role === 'MODERATOR' || user?.role === 'ADMIN') && (
            <TouchableOpacity 
              style={styles.moderatorLink}
              onPress={() => router.push('/(moderator)')}
            >
              <PecaeGlassCard style={styles.moderatorCard} intensity={isDark ? 30 : 50}>
                <Ionicons name="shield-half" size={24} color={colors.brand} />
                <View style={styles.moderatorTextContainer}>
                  <Text style={[styles.moderatorTitle, { color: colors.brand, fontFamily: typography.display }]}>
                    PAINEL ADMINISTRATIVO
                  </Text>
                  <Text style={[styles.moderatorDesc, { color: colors.textMuted, fontFamily: typography.body }]}>
                    Gerenciar anúncios, usuários e denúncias
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={colors.brand} />
              </PecaeGlassCard>
            </TouchableOpacity>
          )}

          {/* Logout Section */}
          <View style={[styles.section, { marginTop: 40 }]}>
            <TouchableOpacity 
              style={[
                styles.logoutButton, 
                { 
                  borderColor: colors.error + (isDark ? '40' : '60'), 
                  backgroundColor: colors.error + (isDark ? '08' : '15') 
                }
              ]}
              onPress={handleLogout}
            >
              <Ionicons name="power" size={20} color={colors.error} />
              <Text style={[styles.logoutText, { color: colors.error, fontFamily: typography.display }]}>
                SAIR DA CONTA
              </Text>
            </TouchableOpacity>
            
            <View style={styles.versionContainer}>
              <Text style={[styles.versionLabel, { color: colors.textMuted, fontFamily: typography.mono }]}>
                PECAÊ PLATFORM
              </Text>
              <Text style={[styles.versionValue, { color: colors.textMuted, fontFamily: typography.mono }]}>
                v1.2.0-STABLE
              </Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    letterSpacing: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  heroInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    marginBottom: 10,
    opacity: 0.7,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    gap: 4,
  },
  verifiedText: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },
  glassCard: {
    padding: 0,
  },
  menuGroup: {
    padding: 0,
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  toggleLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 15,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 10,
    paddingLeft: 4,
    opacity: 0.6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
    opacity: 0.5,
  },
  moderatorLink: {
    marginTop: 32,
  },
  moderatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  moderatorTextContainer: {
    flex: 1,
  },
  moderatorTitle: {
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 2,
  },
  moderatorDesc: {
    fontSize: 11,
    opacity: 0.7,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  logoutText: {
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '700',
  },
  versionContainer: {
    marginTop: 24,
    alignItems: 'center',
    opacity: 0.4,
  },
  versionLabel: {
    fontSize: 9,
    letterSpacing: 3,
    marginBottom: 4,
  },
  versionValue: {
    fontSize: 10,
  },
});
