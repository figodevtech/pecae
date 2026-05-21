import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  RefreshControl
} from 'react-native';
import { PecaeBackground, PecaeGlassCard, PecaeScreenContainer } from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

interface Report {
  id: string;
  category: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  reporter: {
    name: string;
    email: string;
  };
  reportedUser?: {
    name: string;
    email: string;
  };
  listingId?: string;
  chatRoomId?: string;
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const month = months[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
  } catch (e) {
    return dateString;
  }
};

export default function ModerationReportsScreen() {
  const { colors, typography, effects } = usePecaeTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Erro ao buscar denúncias:', error);
      Alert.alert('Erro', 'Não foi possível carregar a fila de moderação.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId: string, status: 'RESOLVED' | 'REJECTED') => {
    try {
      await api.patch(`/reports/${reportId}/status`, { status });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
      Alert.alert('Sucesso', `Denúncia marcada como ${status === 'RESOLVED' ? 'Resolvida' : 'Rejeitada'}.`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status da denúncia.');
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      FRAUD: 'Fraude',
      SPAM: 'Spam',
      INAPPROPRIATE_CONTENT: 'Conteúdo Impróprio',
      OFFENSIVE_BEHAVIOR: 'Comportamento Ofensivo',
      OTHER: 'Outro',
    };
    return categories[category] || category;
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <PecaeGlassCard intensity={item.status === 'OPEN' ? 20 : 5} style={styles.reportCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: item.status === 'OPEN' ? colors.brand + '33' : colors.textMuted + '22' }]}>
          <Text style={[styles.badgeText, { color: item.status === 'OPEN' ? colors.brand : colors.textMuted }]}>
            {item.status}
          </Text>
        </View>
        <Text style={[styles.dateText, { color: colors.textMuted, fontFamily: typography.body }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      <Text style={[styles.categoryTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
        {getCategoryLabel(item.category).toUpperCase()}
      </Text>
      
      <Text style={[styles.reasonText, { color: colors.textPrimary, fontFamily: typography.body }]}>
        "{item.reason}"
      </Text>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <Ionicons name="person-outline" size={14} color={colors.brand} />
        <Text style={[styles.detailText, { color: colors.textMuted, fontFamily: typography.medium }]}>
          Repórter: {item.reporter.name}
        </Text>
      </View>

      {item.reportedUser && (
        <View style={styles.detailsRow}>
          <Ionicons name="warning-outline" size={14} color="#FF4B4B" />
          <Text style={[styles.detailText, { color: colors.textMuted, fontFamily: typography.medium }]}>
            Denunciado: {item.reportedUser.name}
          </Text>
        </View>
      )}

      {item.status === 'OPEN' && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.brand }]}
            onPress={() => handleUpdateStatus(item.id, 'RESOLVED')}
          >
            <Text style={[styles.actionText, { color: '#000', fontFamily: typography.bold }]}>RESOLVER</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => handleUpdateStatus(item.id, 'REJECTED')}
          >
            <Text style={[styles.actionText, { color: colors.textPrimary, fontFamily: typography.bold }]}>REJEITAR</Text>
          </TouchableOpacity>
        </View>
      )}
    </PecaeGlassCard>
  );

  return (
    <PecaeBackground>
      <PecaeScreenContainer>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
            FILA DE MODERAÇÃO
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
            Revise e tome ações sobre as denúncias da comunidade.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={renderReportItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={isRefreshing} 
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchReports();
                }}
                tintColor={colors.brand}
              />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="shield-checkmark-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Nenhuma denúncia pendente. Bom trabalho!
                </Text>
              </View>
            }
          />
        )}
      </PecaeScreenContainer>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 40,
    gap: 16,
  },
  reportCard: {
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 11,
  },
  categoryTitle: {
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  actionText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  }
});
