import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';

export default function CentralSeguranca() {
  const { colors, typography, isDark } = usePecaeTheme();
  const router = useRouter();

  const conexoesLog = [
    {
      id: '1',
      dispositivo: 'iPhone 15 Pro Max',
      localizacao: 'São Paulo, Brasil',
      dataHora: 'Hoje, 14:32',
      ip: '192.168.1.45',
    },
    {
      id: '2',
      dispositivo: 'MacBook Air (Chrome)',
      localizacao: 'Rio de Janeiro, Brasil',
      dataHora: '25 Abr 2026, 09:15',
      ip: '177.34.12.89',
    },
  ];

  return (
    <PecaeBackground>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Segurança',
            headerTransparent: true,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontFamily: typography.display, fontSize: 18 },
          }}
        />

        <View style={styles.headerSpacer} />

        <ScrollView 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Nível de Segurança */}
          <PecaeGlassCard style={styles.sectionCard} intensity={isDark ? 15 : 40}>
            <Text style={[styles.sectionTitle, { color: colors.brand, fontFamily: typography.display }]}>
              NÍVEL DE SEGURANÇA
            </Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border + '50' }]}>
                <View style={[styles.progressFill, { backgroundColor: '#22c55e', width: '85%' }]} />
              </View>
              <Text style={[styles.progressText, { color: '#22c55e', fontFamily: typography.display }]}>
                85%
              </Text>
            </View>
            <Text style={[styles.desc, { color: colors.textMuted, fontFamily: typography.body }]}>
              Sua conta está altamente protegida. Adicione a autenticação de 2 fatores para atingir 100%.
            </Text>
          </PecaeGlassCard>

          {/* Selo de Verificação */}
          <PecaeGlassCard style={styles.sectionCard} intensity={isDark ? 10 : 35}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="shield-checkmark" size={24} color={colors.brand} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                PERFIL VERIFICADO
              </Text>
            </View>
            <Text style={[styles.desc, { color: colors.textMuted, fontFamily: typography.body }]}>
              Aumente a confiança em suas negociações confirmando sua identidade oficial.
            </Text>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.brand }]}>
              <Text style={[styles.actionBtnText, { color: colors.brand, fontFamily: typography.display }]}>
                VERIFICAR AGORA
              </Text>
            </TouchableOpacity>
          </PecaeGlassCard>

          <Text style={[styles.groupLabel, { color: colors.textMuted, fontFamily: typography.display }]}>
            MÉTODOS DE ACESSO
          </Text>

          <PecaeGlassCard style={styles.methodsCard} intensity={isDark ? 5 : 25}>
            <TouchableOpacity style={styles.methodRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.brand + '15' }]}>
                <Ionicons name="finger-print-outline" size={20} color={colors.brand} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodText, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  Biometria / FaceID
                </Text>
                <Text style={[styles.methodStatus, { color: '#22c55e', fontFamily: typography.body }]}>Ativo neste dispositivo</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: colors.border + '30' }]} />

            <TouchableOpacity style={styles.methodRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.textMuted + '15' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.textMuted} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodText, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  Verificação em duas etapas
                </Text>
                <Text style={[styles.methodStatus, { color: colors.textMuted, fontFamily: typography.body }]}>Não configurado</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </PecaeGlassCard>

          <Text style={[styles.groupLabel, { color: colors.textMuted, fontFamily: typography.display }]}>
            DISPOSITIVOS CONECTADOS
          </Text>
          
          <PecaeGlassCard style={styles.logsCard} intensity={isDark ? 5 : 25}>
            {conexoesLog.map((log, index) => (
              <React.Fragment key={log.id}>
                {index > 0 && <View style={[styles.separator, { backgroundColor: colors.border + '30' }]} />}
                <View style={styles.logRow}>
                  <View style={styles.logMain}>
                    <Text style={[styles.logDevice, { color: colors.textPrimary, fontFamily: typography.display }]}>
                      {log.dispositivo}
                    </Text>
                    <Text style={[styles.logInfo, { color: colors.textMuted, fontFamily: typography.body }]}>
                      {log.localizacao} • {log.dataHora}
                    </Text>
                    <Text style={[styles.logIp, { color: colors.textMuted + '80', fontFamily: typography.mono }]}>
                      IP: {log.ip}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={20} color={colors.error || '#ef4444'} />
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))}
          </PecaeGlassCard>

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
    height: 80,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    width: 35,
    textAlign: 'right',
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    letterSpacing: 1,
  },
  actionBtn: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  groupLabel: {
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 12,
    paddingLeft: 4,
    opacity: 0.6,
  },
  methodsCard: {
    padding: 8,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodText: {
    fontSize: 14,
  },
  methodStatus: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginHorizontal: 12,
  },
  logsCard: {
    padding: 8,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  logMain: {
    flex: 1,
  },
  logDevice: {
    fontSize: 14,
    marginBottom: 4,
  },
  logInfo: {
    fontSize: 12,
    opacity: 0.7,
  },
  logIp: {
    fontSize: 10,
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
  },
});
