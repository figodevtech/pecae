import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  PecaeBackground, 
  PecaeGlassCard, 
  StatWidget, 
  PecaeButton 
} from '../../../src/components/PecaeUI';
import { usePecaeTheme } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/auth-store';
import { useSellerDashboard } from '../../../src/hooks/useSellerDashboard';

export default function SellerDashboardScreen() {
  const { colors, typography, effects } = usePecaeTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { stats, recentMessages, isLoadingStats } = useSellerDashboard();

  return (
    <PecaeBackground>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header HUD */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textPrimary, fontFamily: typography.display }]}>
              Olá, {user?.name?.split(' ')[0] || 'Vendedor'}!
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
              Pronto para vender mais hoje?
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(seller)/(seller-tabs)/perfil')}
            style={[styles.profileButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="person" size={22} color={colors.brand} />
          </TouchableOpacity>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <PecaeGlassCard style={styles.metricCard}>
            <StatWidget 
              icon="layers-outline" 
              value={stats?.activeVehicles || 0} 
              label="Veículos Ativos" 
            />
          </PecaeGlassCard>
          <PecaeGlassCard style={styles.metricCard}>
            <StatWidget 
              icon="cash-outline" 
              value={stats?.totalSales || 0} 
              label="Vendas" 
            />
          </PecaeGlassCard>
          <PecaeGlassCard style={styles.metricCard}>
            <StatWidget 
              icon="chatbubbles-outline" 
              value={stats?.activeChats || 0} 
              label="Chat" 
            />
          </PecaeGlassCard>
          <PecaeGlassCard style={styles.metricCard}>
            <StatWidget 
              icon="eye-outline" 
              value={stats?.viewsLast7Days || '0'} 
              label="Visitas (7d)" 
            />
          </PecaeGlassCard>
        </View>

        {/* Verification CTA */}
        <TouchableOpacity onPress={() => router.push('/(seller)/solicitar-verificacao')}>
          <PecaeGlassCard style={styles.verificationBanner} intensity={40}>
            <View style={styles.bannerContent}>
              <View style={[styles.bannerIcon, { backgroundColor: colors.brand }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.dark} />
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={[styles.bannerTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  Aumente sua confiança
                </Text>
                <Text style={[styles.bannerSub, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Solicite o selo de vendedor verificado para destacar seus anúncios.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.brand} />
            </View>
          </PecaeGlassCard>
        </TouchableOpacity>

        {/* Recent Messages */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="history" size={20} color={colors.brand} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
              Últimas Mensagens
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(seller)/(seller-tabs)/mensagens')}>
            <Text style={[styles.viewAll, { color: colors.brand, fontFamily: typography.medium }]}>Ver tudo</Text>
          </TouchableOpacity>
        </View>

        {recentMessages?.map((msg) => (
          <TouchableOpacity key={msg.id} style={styles.messageItem}>
            <PecaeGlassCard style={styles.messageCard}>
              <View style={styles.messageRow}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.avatarLetter, { color: colors.brand, fontFamily: typography.display }]}>
                    {msg.senderName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <Text style={[styles.senderName, { color: colors.textPrimary, fontFamily: typography.display }]}>
                      {msg.senderName}
                    </Text>
                    <Text style={[styles.messageTime, { color: colors.textMuted, fontFamily: typography.body }]}>
                      {msg.time}
                    </Text>
                  </View>
                  <Text style={[styles.messageSubject, { color: colors.brand, fontFamily: typography.medium }]} numberOfLines={1}>
                    {msg.subject}
                  </Text>
                  <Text style={[styles.messageText, { color: colors.textMuted, fontFamily: typography.body }]} numberOfLines={1}>
                    {msg.lastText}
                  </Text>
                </View>
              </View>
            </PecaeGlassCard>
          </TouchableOpacity>
        ))}

        <PecaeButton 
          title="Cadastrar Sucata" 
          onPress={() => router.push('/(seller)/cadastrar-sucata')}
          style={styles.fabButton}
          icon={<Ionicons name="add" size={24} color={colors.dark} />}
        />

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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    padding: 0,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(226, 255, 0, 0.1)',
  },
  verificationBanner: {
    marginBottom: 30,
    borderColor: 'rgba(226, 255, 0, 0.3)',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
    marginLeft: 16,
    paddingRight: 8,
  },
  bannerTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    marginLeft: 8,
  },
  viewAll: {
    fontSize: 14,
  },
  messageItem: {
    marginBottom: 12,
  },
  messageCard: {
    padding: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarLetter: {
    fontSize: 20,
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 15,
  },
  messageTime: {
    fontSize: 11,
  },
  messageSubject: {
    fontSize: 12,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
  },
  fabButton: {
    marginTop: 20,
    height: 56,
  },
});
