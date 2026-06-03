import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  PecaeBackground,
  PecaeGlassCard,
  PecaeButton,
  PecaeScreenContainer,
} from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';

export default function AdminAnalyticsScreen() {
  const { colors, typography } = usePecaeTheme();

  const { data: analytics, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const response = await api.get('/analytics/admin');
      return response.data;
    },
  });

  const recalcMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/analytics/trigger-recalc');
      return response.data;
    },
    onSuccess: (res) => {
      Alert.alert('SUCESSO', res?.message || 'Recálculo agendado com sucesso!');
      refetch();
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || 'Falha ao agendar recálculo.';
      Alert.alert('ERRO', errMsg);
    }
  });

  if (isLoading) {
    return (
      <PecaeBackground>
        <PecaeScreenContainer>
          <View style={styles.centered}>
            <Text style={{ color: colors.textPrimary, fontFamily: typography.body }}>
              Carregando métricas globais...
            </Text>
          </View>
        </PecaeScreenContainer>
      </PecaeBackground>
    );
  }

  return (
    <PecaeBackground>
      <PecaeScreenContainer>
        <ScrollView 
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.brand} />
          }
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
              MÉTRICAS DA PLATAFORMA
            </Text>
            <Text style={[styles.subtitle, { color: colors.brand, fontFamily: typography.heading }]}>
              // AGGREGATE_DASHBOARD
            </Text>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <PecaeGlassCard style={styles.statCard}>
              <Ionicons name="people-outline" size={24} color={colors.brand} style={styles.icon} />
              <Text style={[styles.statValue, { color: colors.textPrimary, fontFamily: typography.display }]}>
                {analytics?.dau || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: typography.body }]}>
                DAU (24h)
              </Text>
            </PecaeGlassCard>

            <PecaeGlassCard style={styles.statCard}>
              <Ionicons name="person-add-outline" size={24} color={colors.vibrant} style={styles.icon} />
              <Text style={[styles.statValue, { color: colors.textPrimary, fontFamily: typography.display }]}>
                {analytics?.newUsers24h || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: typography.body }]}>
                Novos Usuários
              </Text>
            </PecaeGlassCard>
          </View>

          <View style={styles.statsGrid}>
            <PecaeGlassCard style={styles.statCard}>
              <Ionicons name="shield-outline" size={24} color="#FACC15" style={styles.icon} />
              <Text style={[styles.statValue, { color: colors.textPrimary, fontFamily: typography.display }]}>
                {analytics?.pendingModerations || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: typography.body }]}>
                Pendências
              </Text>
            </PecaeGlassCard>

            <PecaeGlassCard style={styles.statCard}>
              <Ionicons name="globe-outline" size={24} color="#38BDF8" style={styles.icon} />
              <Text style={[styles.statValue, { color: colors.textPrimary, fontFamily: typography.display }]}>
                {analytics?.totalUsers || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: typography.body }]}>
                Base Total
              </Text>
            </PecaeGlassCard>
          </View>

          {/* Listings by Status */}
          <PecaeGlassCard style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.heading }]}>
              Anúncios por Estado
            </Text>
            
            <View style={styles.statusRow}>
              <View style={styles.statusCol}>
                <Text style={[styles.statusCount, { color: colors.brand }]}>
                  {analytics?.listingsByStatus?.PUBLISHED || 0}
                </Text>
                <Text style={[styles.statusLabel, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Publicados
                </Text>
              </View>
              <View style={styles.statusCol}>
                <Text style={[styles.statusCount, { color: '#FACC15' }]}>
                  {analytics?.listingsByStatus?.PENDING || 0}
                </Text>
                <Text style={[styles.statusLabel, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Pendentes
                </Text>
              </View>
              <View style={styles.statusCol}>
                <Text style={[styles.statusCount, { color: '#EF4444' }]}>
                  {analytics?.listingsByStatus?.REJECTED || 0}
                </Text>
                <Text style={[styles.statusLabel, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Rejeitados
                </Text>
              </View>
            </View>
          </PecaeGlassCard>

          {/* Action Trigger */}
          <PecaeButton
            title="Sincronizar Estatísticas"
            variant="outline"
            onPress={() => recalcMutation.mutate()}
            loading={recalcMutation.isPending}
            style={styles.recalcBtn}
            textStyle={{ letterSpacing: 2 }}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </PecaeScreenContainer>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  sectionCard: {
    padding: 16,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statusCol: {
    alignItems: 'center',
  },
  statusCount: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statusLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  recalcBtn: {
    marginTop: 12,
  },
});
