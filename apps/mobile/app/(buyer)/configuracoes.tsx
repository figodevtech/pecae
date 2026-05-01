import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';

/**
 * 🤖 Applying knowledge of @frontend-specialist...
 * Refactoring Settings Hub
 * Following Industrial Glassmorphism standards
 */

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  iconType?: 'ionic' | 'material';
  title: string;
  subtitle: string;
  onPress: () => void;
  color?: string;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ 
  icon, 
  iconType = 'ionic', 
  title, 
  subtitle, 
  onPress,
  color
}) => {
  const { colors, typography, isDark } = usePecaeTheme();
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.itemWrapper}>
      <PecaeGlassCard style={styles.itemCard} intensity={isDark ? 8 : 15}>
        <View style={styles.itemRow}>
          <View style={[styles.iconContainer, { backgroundColor: (color || colors.brand) + '15' }]}>
            {iconType === 'ionic' ? (
              <Ionicons name={icon as any} size={22} color={color || colors.brand} />
            ) : (
              <MaterialCommunityIcons name={icon as any} size={22} color={color || colors.brand} />
            )}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.itemTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
              {title}
            </Text>
            <Text style={[styles.itemSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              {subtitle}
            </Text>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ opacity: 0.5 }} />
        </View>
      </PecaeGlassCard>
    </TouchableOpacity>
  );
};

export default function Configuracoes() {
  const { colors, typography } = usePecaeTheme();
  const router = useRouter();

  return (
    <PecaeBackground>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'CONFIGURAÇÕES',
            headerTransparent: true,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontFamily: typography.display, fontSize: 16, letterSpacing: 1.5 },
          }}
        />

        <View style={styles.headerSpacer} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.mono }]}>
            [01] PREFERÊNCIAS
          </Text>
          
          <SettingsItem 
            icon="notifications"
            title="Notificações"
            subtitle="Canais de alerta, e-mail e push"
            onPress={() => router.push('/(buyer)/configuracoes-notificacao')}
          />

          <SettingsItem 
            icon="shield-checkmark"
            title="Segurança"
            subtitle="Senha, biometria e privacidade"
            onPress={() => router.push('/(buyer)/seguranca')}
          />

          <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.mono, marginTop: 24 }]}>
            [02] CONTA
          </Text>

          <SettingsItem 
            icon="account-edit"
            iconType="material"
            title="Editar Perfil"
            subtitle="Dados pessoais e foto de exibição"
            onPress={() => router.push('/(buyer)/perfil-editar')}
          />

          <SettingsItem 
            icon="help-circle"
            title="Ajuda & Suporte"
            subtitle="FAQ, contato e termos de uso"
            onPress={() => router.push('/(buyer)/ajuda')}
          />

          <SettingsItem 
            icon="trash-outline"
            title="Excluir Conta"
            subtitle="Remover seus dados permanentemente"
            onPress={() => router.push('/(buyer)/excluir-conta')}
            color="#EF4444"
          />

          <View style={styles.footer}>
            <Text style={[styles.versionText, { color: colors.textMuted, fontFamily: typography.mono }]}>
              PECAÊ APP v1.2.4
            </Text>
            <Text style={[styles.buildText, { color: colors.textMuted, fontFamily: typography.mono }]}>
              BUILD_ID: 20260501_REFINEMENT
            </Text>
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
  headerSpacer: {
    height: 100,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 16,
    paddingLeft: 4,
    opacity: 0.6,
  },
  itemWrapper: {
    marginBottom: 12,
  },
  itemCard: {
    padding: 0,
    borderWidth: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
    opacity: 0.4,
  },
  versionText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  buildText: {
    fontSize: 8,
    marginTop: 4,
  },
});
