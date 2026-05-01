import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator, Alert, ScrollView, SafeAreaView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { usePecaeTheme } from '../../src/theme';
import { useBuyerProfile, useUpdateNotificationPreferences } from '../../src/hooks/useBuyer';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';

export default function Configuracoes() {
  const { colors, typography, isDark } = usePecaeTheme();
  
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
          Alert.alert('Atenção', 'Você precisa habilitar notificações nas configurações do sistema para receber alertas push.');
          setPushEnabled(false);
          return;
        }
      }

      setPushEnabled(value);
      await updatePrefsMutation.mutateAsync({ push: value });
    } catch (error) {
      setPushEnabled(!value);
      Alert.alert('Erro', 'Não foi possível atualizar a preferência.');
    }
  };

  const handleToggleEmail = async (value: boolean) => {
    try {
      setEmailEnabled(value);
      await updatePrefsMutation.mutateAsync({ email: value });
    } catch (error) {
      setEmailEnabled(!value);
      Alert.alert('Erro', 'Não foi possível atualizar a preferência.');
    }
  };

  const handleToggleInApp = async (value: boolean) => {
    try {
      setInAppEnabled(value);
      await updatePrefsMutation.mutateAsync({ inApp: value });
    } catch (error) {
      setInAppEnabled(!value);
      Alert.alert('Erro', 'Não foi possível atualizar a preferência.');
    }
  };

  if (isLoading) {
    return (
      <PecaeBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
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
            title: 'Configurações',
            headerTransparent: true,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontFamily: typography.display, fontSize: 18 },
          }}
        />

        <View style={styles.headerSpacer} />

        <ScrollView contentContainerStyle={styles.listContent}>
          <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.display }]}>
            NOTIFICAÇÕES
          </Text>
          
          <PecaeGlassCard style={styles.card} intensity={isDark ? 10 : 30}>
            <View style={styles.row}>
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>Notificações Push</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Receba alertas no seu celular mesmo com o app fechado
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

            <View style={[styles.separator, { backgroundColor: colors.border + '30' }]} />

            <View style={styles.row}>
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>E-mail</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Receba resumos e ofertas importantes por e-mail
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

            <View style={[styles.separator, { backgroundColor: colors.border + '30' }]} />

            <View style={styles.row}>
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>In-App</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Receba alertas dentro do app (mensagens, atualizações)
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

          <View style={styles.footerInfo}>
            <Text style={[styles.versionText, { color: colors.textMuted, fontFamily: typography.mono }]}>
              Versão 1.2.4 (Build 20240428)
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
  },
  headerSpacer: {
    height: 80,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 16,
    paddingLeft: 4,
    opacity: 0.6,
  },
  card: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 15,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.7,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  footerInfo: {
    marginTop: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 10,
    letterSpacing: 1,
    opacity: 0.5,
  },
});
