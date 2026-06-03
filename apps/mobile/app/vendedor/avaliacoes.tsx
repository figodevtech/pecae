import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { 
  PecaeBackground, 
  PecaeGlassCard 
} from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';

export default function AllReviewsScreen() {
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  const router = useRouter();
  const { colors, typography } = usePecaeTheme();

  const { data: reviewsResponse, isLoading } = useQuery({
    queryKey: ['seller-reviews-all', sellerId],
    queryFn: async () => {
      const response = await api.get(`/sellers/${sellerId}/reviews`, { params: { limit: 50 } });
      return response.data;
    },
    enabled: !!sellerId,
  });

  const renderReviewItem = ({ item }: { item: any }) => (
    <PecaeGlassCard style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={[styles.buyerName, { color: colors.textPrimary, fontFamily: typography.heading }]}>
          {item.buyerName}
        </Text>
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < item.rating ? 'star' : 'star-outline'}
              size={14}
              color={i < item.rating ? '#F59E0B' : '#94A3B8'}
            />
          ))}
        </View>
      </View>
      {item.comment && (
        <Text style={[styles.reviewComment, { color: colors.textMuted, fontFamily: typography.body }]}>
          {item.comment}
        </Text>
      )}
      <Text style={[styles.reviewDate, { color: colors.textMuted, fontFamily: typography.body }]}>
        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
      </Text>
    </PecaeGlassCard>
  );

  if (isLoading) {
    return (
      <PecaeBackground>
        <View style={styles.center}>
          <Text style={{ color: colors.textMuted }}>Carregando avaliações...</Text>
        </View>
      </PecaeBackground>
    );
  }

  return (
    <PecaeBackground>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={colors.textPrimary} 
            onPress={() => router.back()} 
          />
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
            TODAS AS AVALIAÇÕES
          </Text>
        </View>

        <FlatList
          data={reviewsResponse?.data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <PecaeGlassCard style={styles.emptyCard}>
              <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
                Nenhuma avaliação encontrada.
              </Text>
            </PecaeGlassCard>
          }
        />
      </View>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    letterSpacing: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  reviewCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buyerName: {
    fontSize: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    textAlign: 'right',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
  }
});
