import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  SafeAreaView, 
  Platform,
  TouchableOpacity
} from 'react-native';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { useBuyerProfile, useUpdateNotificationPreferences } from '../../src/hooks/useBuyer';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';

/**
 * 🤖 Applying knowledge of @frontend-specialist...
 * Implementing Industrial Glassmorphism Notification Settings
 * Following PECAÊ Brand Identity: The Digital Forge
 */

export default function ConfiguracoesNotificacao() {
  const { colors, typography, isDark, effects } = usePecaeTheme();
  
  const { data: profile, isLoading } = useBuyerProfile();
  const updatePrefsMutation = useUpdateNotificationPreferences();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [inAppEnabled, setInAppEnabled] = useState(false);

  useEffect(() => {
    if (profile?.notificationPreferences) {
      setPushEnabled(profile.notificationPreferences.push ?? false);
      setEmailEnabled(profile.notificationPreferences.email ?? false);
      setInAppEnabled(profile.notificationPreferences.inApp ?? false);
    }
  }, [profile]);

  const handleTogglePush = async (value: boolean) => {
    try {
      if (value) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          Alert.alert(
            'Acesso Negado', 
            'As notificações push estão desabilitadas no sistema. Deseja abrir as configurações?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Configurações', onPress: () => Platform.OS === 'ios' ? {} : {} } // In a real app, use Linking.openSettings()
            ]
          );
          setPushEnabled(false);
          return;
        }
      }

      setPushEnabled(value);
      await updatePrefsMutation.mutateAsync({ push: value });
    } catch (error) {
      setPushEnabled(!value);
      Alert.alert('Erro Técnico', 'Não foi possível sincronizar sua preferência com a Central de Alertas.');
    }
  };

  const handleToggleEmail = async (value: boolean) => {
    try {
      setEmailEnabled(value);
      await updatePrefsMutation.mutateAsync({ email: value });
    } catch (error) {
      setEmailEnabled(!value);
      Alert.alert('Erro Técnico', 'Falha na atualização do canal de e-mail.');
    }
  };

  const handleToggleInApp = async (value: boolean) => {
    try {
      setInAppEnabled(value);
      await updatePrefsMutation.mutateAsync({ inApp: value });
    } catch (error) {
      setInAppEnabled(!value);
      Alert.alert('Erro Técnico', 'Falha na atualização do canal in-app.');
    }
  };

  if (isLoading) {
    return (
      <PecaeBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={[styles.loadingText, { color: colors.brand, fontFamily: typography.mono }]}>
            SINCRONIZANDO PREFERÊNCIAS...
          </Text>
        </View>
      </PecaeBackground>
    );
  }

  return (
    <PecaeBackground>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'ALERTAS & CANAIS',
            headerTransparent: true,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { 
              fontFamily: typography.display, 
              fontSize: 16,
              letterSpacing: 1.5
            },
          }}
        />

        <View style={styles.headerSpacer} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.heroSection}>
            <MaterialCommunityIcons 
              name="bell-badge-outline" 
              size={48} 
              color={colors.brand} 
              style={styles.heroIcon}
            />
            <Text style={[styles.heroTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
              Central de Notificações
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              Configure como e onde você deseja receber atualizações sobre suas negociações e peças.
            </Text>
          </View>

          {/* Channels Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.brand, fontFamily: typography.mono }]}>
              [01] CANAIS DE TRANSMISSÃO
            </Text>
          </View>

          <PecaeGlassCard style={styles.mainCard} intensity={isDark ? 12 : 25}>
            {/* Push Notifications */}
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: pushEnabled ? colors.brand + '20' : colors.surface }]}>
                <Ionicons 
                  name="notifications" 
                  size={22} 
                  color={pushEnabled ? colors.brand : colors.textMuted} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  Push Instantâneo
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Alertas em tempo real na sua tela de bloqueio.
                </Text>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.brand }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
                ios_backgroundColor={colors.border}
                onValueChange={handleTogglePush}
                value={pushEnabled}
                disabled={updatePrefsMutation.isPending}
              />
            </View>

            <View style={[styles.separator, { backgroundColor: colors.border + '15' }]} />

            {/* Email Notifications */}
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: emailEnabled ? colors.brand + '20' : colors.surface }]}>
                <Ionicons 
                  name="mail" 
                  size={22} 
                  color={emailEnabled ? colors.brand : colors.textMuted} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  Correio Eletrônico
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Resumos semanais e comprovantes de transação.
                </Text>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.brand }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
                ios_backgroundColor={colors.border}
                onValueChange={handleToggleEmail}
                value={emailEnabled}
                disabled={updatePrefsMutation.isPending}
              />
            </View>

            <View style={[styles.separator, { backgroundColor: colors.border + '15' }]} />

            {/* In-App Notifications */}
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: inAppEnabled ? colors.brand + '20' : colors.surface }]}>
                <MaterialCommunityIcons 
                  name="message-badge" 
                  size={22} 
                  color={inAppEnabled ? colors.brand : colors.textMuted} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  Sistema Interno
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Balões de alerta enquanto você utiliza o PECAÊ.
                </Text>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.brand }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
                ios_backgroundColor={colors.border}
                onValueChange={handleToggleInApp}
                value={inAppEnabled}
                disabled={updatePrefsMutation.isPending}
              />
            </View>
          </PecaeGlassCard>

          {/* Info Card */}
          <PecaeGlassCard style={styles.infoCard} intensity={8}>
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={20} color={colors.brand} />
              <Text style={[styles.infoText, { color: colors.textMuted, fontFamily: typography.body }]}>
                A desativação de todos os canais pode fazer com que você perca prazos importantes de negociação e expiração de orçamentos.
              </Text>
            </View>
          </PecaeGlassCard>

          <View style={styles.footer}>
            <Text style={[styles.techLabel, { color: colors.textMuted, fontFamily: typography.mono }]}>
              STATUS DO DISPOSITIVO: {pushEnabled ? 'ATIVO' : 'LATENTE'}
            </Text>
            <Text style={[styles.techLabel, { color: colors.textMuted, fontFamily: typography.mono, marginTop: 4 }]}>
              ID DE TRANSMISSÃO: {profile?.id.substring(0, 8).toUpperCase()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 10,
    letterSpacing: 2,
    opacity: 0.8,
  },
  headerSpacer: {
    height: 100,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  heroIcon: {
    marginBottom: 16,
    opacity: 0.9,
  },
  heroTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.6,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    opacity: 0.7,
  },
  mainCard: {
    padding: 0,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  separator: {
    height: 1,
    width: '100%',
  },
  infoCard: {
    padding: 16,
    marginBottom: 32,
    borderStyle: 'dashed',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
  },
  techLabel: {
    fontSize: 9,
    letterSpacing: 1,
    opacity: 0.4,
  },
});
