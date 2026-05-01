import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PecaeBackground, PecaeGlassCard, StatWidget, PecaeButton } from '../../../src/components/PecaeUI';
import { usePecaeTheme } from '../../../src/theme';
import { api } from '../../../src/services/api';
import { Image } from 'react-native';
import { useAuthStore } from '../../../src/store/auth-store';

export default function SellerProfileScreen() {
  const { colors, effects } = usePecaeTheme();
  const PecaeTokens = require('../../../src/theme/pecae-tokens').PecaeTokens;
  const user = useAuthStore((state) => state.user);

  const { data: seller, isLoading: isLoadingSeller } = useQuery({
    queryKey: ['seller-me'],
    queryFn: async () => {
      const response = await api.get('/sellers/me');
      return response.data;
    },
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['seller-analytics'],
    queryFn: async () => {
      const response = await api.get('/analytics/seller/me?periodDays=30');
      return response.data;
    },
  });

  const handleVerificationRequest = () => {
    router.push('/(seller)/solicitar-verificacao');
  };

  const menuItems = [
    { icon: 'create-outline', label: 'Editar Perfil', action: () => router.push('/(seller)/perfil-editar') },
    { icon: 'shield-checkmark-outline', label: 'Segurança', action: () => {} },
    { icon: 'notifications-outline', label: 'Notificações', action: () => {} },
    { icon: 'help-buoy-outline', label: 'Suporte Técnico', action: () => {} },
    { icon: 'settings-outline', label: 'Configurações', action: () => {} },
  ];

  const quickActions = [
    { icon: 'add-circle', label: 'Novo Anúncio', color: colors.brand },
    { icon: 'wallet', label: 'Financeiro', color: colors.vibrant },
    { icon: 'chatbubbles', label: 'Mensagens', color: '#7ae6ff' },
  ];

  return (
    <PecaeBackground>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.push('/(seller)/perfil-editar')}
            style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {seller?.logo ? (
              <Image source={{ uri: seller.logo }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.brand, fontFamily: PecaeTokens.typography.display }]}>
                {seller?.storeName?.charAt(0) || user?.name?.charAt(0) || 'V'}
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.nameContainer}>
              <Text style={[styles.storeName, { color: colors.textPrimary, fontFamily: PecaeTokens.typography.heading }]}>
                {seller?.storeName || 'Loja sem nome'}
              </Text>
              {seller?.isVerified && (
                <Ionicons name="checkmark-circle" size={18} color={colors.brand} style={styles.verifiedIcon} />
              )}
            </View>
            <Text style={[styles.userName, { color: colors.textMuted, fontFamily: PecaeTokens.typography.body }]}>
              {user?.name || user?.email}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <PecaeGlassCard style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <StatWidget 
              icon="layers-outline" 
              value={seller?.stats?.activeListings || 0} 
              label="Ativos" 
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StatWidget 
              icon="cash-outline" 
              value={seller?.stats?.totalSold || 0} 
              label="Vendidos" 
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StatWidget 
              icon="timer-outline" 
              value={seller?.stats?.avgResponseTimeMinutes ? `${seller.stats.avgResponseTimeMinutes}m` : '--'} 
              label="Resposta" 
            />
          </View>
        </PecaeGlassCard>

        {/* Verification Banner */}
        {!seller?.isVerified && (
          <TouchableOpacity onPress={handleVerificationRequest}>
            <PecaeGlassCard style={styles.verificationBanner} intensity={40}>
              <View style={styles.bannerContent}>
                <View style={[styles.bannerIcon, { backgroundColor: colors.brand }]}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.dark} />
                </View>
                <View style={styles.bannerTextContainer}>
                  <Text style={[styles.bannerTitle, { color: colors.textPrimary, fontFamily: PecaeTokens.typography.heading }]}>
                    Solicitar Verificação
                  </Text>
                  <Text style={[styles.bannerSub, { color: colors.textMuted, fontFamily: PecaeTokens.typography.body }]}>
                    Aumente sua credibilidade e vendas
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.brand} />
              </View>
            </PecaeGlassCard>
          </TouchableOpacity>
        )}

        {/* Analytics & Performance Section */}
        <PecaeGlassCard style={styles.analyticsCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: PecaeTokens.typography.heading }]}>
            Desempenho da Loja
          </Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.brand, fontFamily: PecaeTokens.typography.display }]}>
                {analytics?.summary?.totalViews || 0}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted, fontFamily: PecaeTokens.typography.body }]}>
                Visualizações
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.vibrant, fontFamily: PecaeTokens.typography.display }]}>
                {analytics?.summary?.totalChats || 0}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted, fontFamily: PecaeTokens.typography.body }]}>
                Chats Iniciados
              </Text>
            </View>
          </View>

          {analytics?.viewsTimeline && analytics.viewsTimeline.length > 0 && analytics.summary.totalViews > 0 ? (
            <View style={styles.chartContainer}>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary, fontFamily: PecaeTokens.typography.medium }]}>
                Visualizações nos últimos 7 dias
              </Text>
              <View style={styles.barsRow}>
                {analytics.viewsTimeline.slice(-7).map((point: any, idx: number) => {
                  const maxCount = Math.max(...analytics.viewsTimeline.map((p: any) => p.count), 1);
                  const barHeight = (point.count / maxCount) * 100;
                  return (
                    <View key={idx} style={styles.barWrapper}>
                      <View style={styles.barBackground}>
                        <View 
                          style={[
                            styles.bar, 
                            { 
                              height: `${Math.max(barHeight, 6)}%`, 
                              backgroundColor: colors.brand 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.barLabel, { color: colors.textMuted, fontFamily: PecaeTokens.typography.body }]}>
                        {point.date.split('-')[2]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="stats-chart" size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyStateText, { color: colors.textMuted, fontFamily: PecaeTokens.typography.body }]}>
                Seu histórico de visualizações aparecerá aqui. Cadastre peças para incentivar o engajamento!
              </Text>
            </View>
          )}
        </PecaeGlassCard>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionItem}>
              <PecaeGlassCard style={styles.quickActionCard}>
                <Ionicons name={action.icon as any} size={28} color={action.color} />
                <Text style={[styles.quickActionLabel, { color: colors.textPrimary, fontFamily: PecaeTokens.typography.medium }]}>
                  {action.label}
                </Text>
              </PecaeGlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Menu Section */}
        <PecaeGlassCard style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.menuItem, 
                index !== menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
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

        <PecaeButton 
          title="Sair da Conta" 
          variant="outline" 
          onPress={() => useAuthStore.getState().clearAuth()}
          style={styles.logoutButton}
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
  },
  headerInfo: {
    marginLeft: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 20,
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  userName: {
    fontSize: 14,
    marginTop: 2,
  },
  statsCard: {
    marginBottom: 20,
    padding: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    width: 1,
    height: '60%',
    opacity: 0.3,
  },
  verificationBanner: {
    marginBottom: 20,
    borderColor: 'rgba(63, 255, 139, 0.3)',
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
  },
  bannerTitle: {
    fontSize: 16,
  },
  bannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionItem: {
    width: '31%',
  },
  quickActionCard: {
    alignItems: 'center',
    padding: 12,
    height: 100,
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 9,
    marginTop: 8,
    textTransform: 'uppercase',
    textAlign: 'center',
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
  logoutButton: {
    marginTop: 8,
  },
  analyticsCard: {
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  chartContainer: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  chartSubtitle: {
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: 10,
  },
  barWrapper: {
    alignItems: 'center',
    width: '12%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barBackground: {
    width: 12,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
