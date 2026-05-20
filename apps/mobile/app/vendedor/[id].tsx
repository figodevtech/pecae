import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';
import { PecaeButton } from '../../src/components/PecaeUI/PecaeButton';
import { StatWidget } from '../../src/components/PecaeUI/StatWidget';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/services/api';
import { BlurView } from 'expo-blur';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: seller, isLoading } = useQuery({
    queryKey: ['seller-public', id],
    queryFn: async () => {
      const response = await api.get(`/sellers/${id}`);
      return response.data;
    },
  });

  const { data: listings } = useQuery({
    queryKey: ['seller-listings', id],
    queryFn: async () => {
      const response = await api.get(`/sellers/${id}/listings`);
      return response.data;
    },
    enabled: !!seller,
  });

  const { data: reviewsResponse } = useQuery({
    queryKey: ['seller-reviews', id],
    queryFn: async () => {
      const response = await api.get(`/sellers/${id}/reviews`, { params: { limit: 5 } });
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <PecaeBackground>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Sincronizando com PEÇAÊ...</Text>
        </View>
      </PecaeBackground>
    );
  }

  const handleStartChat = () => {
    // Navega para a lista de anúncios do vendedor para o comprador escolher qual negociar
    // O chat é vinculado a um listing específico (M08 — RN11)
    router.push(`/vendedor/${id}`);
    // Scroll para a seção de anúncios via feedback visual
  };

  const handleWhatsApp = () => {
    if (seller?.whatsapp) {
      const phone = seller.whatsapp.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=${phone}`);
    }
  };

  return (
    <PecaeBackground>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Navigation Bar Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BlurView intensity={30} tint="dark" style={styles.blurIcon}>
              <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Profile Card Section */}
        <View style={styles.profileSection}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoOuterRing}>
              {seller?.logo ? (
                <Image source={{ uri: seller.logo }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>
                    {seller?.storeName?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            {seller?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
              </View>
            )}
          </View>
          
          <Text style={styles.storeName}>{seller?.storeName}</Text>
          
          <View style={styles.infoPills}>
            {seller?.stats?.rating !== undefined && seller?.stats?.rating !== null && (
              <View style={[styles.pill, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={[styles.pillText, { color: '#F59E0B' }]}>
                  {seller.stats.rating.toFixed(1)} ({seller.stats.totalReviews})
                </Text>
              </View>
            )}
            <View style={styles.pill}>
              <Ionicons name="location-sharp" size={14} color="#3B82F6" />
              <Text style={styles.pillText}>{seller?.city}, {seller?.state}</Text>
            </View>
            {seller?.type === 'PJ' && (
              <View style={[styles.pill, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                <Ionicons name="business" size={14} color="#10B981" />
                <Text style={[styles.pillText, { color: '#10B981' }]}>Loja Oficial</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <StatWidget 
            label="Estoque Ativo" 
            value={seller?.stats?.activeListings || 0} 
            icon="car-sport" 
          />
          <StatWidget 
            label="Tempo Resposta" 
            value={seller?.stats?.avgResponseTimeMinutes ? `${seller.stats.avgResponseTimeMinutes}m` : '--'} 
            icon="flash" 
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <PecaeButton 
            title="Iniciar Chat Seguro" 
            onPress={handleStartChat}
            variant="primary"
          />
          <PecaeButton 
            title="Avaliar Vendedor (Teste M06)" 
            onPress={() => router.push(`/chat/test-room/avaliar?sellerId=${id}&storeName=${encodeURIComponent(seller?.storeName || '')}`)}
            variant="outline"
            style={{ marginTop: 8 }}
          />
          {seller?.showWhatsapp && (
            <TouchableOpacity 
              onPress={handleWhatsApp}
              style={styles.whatsappButton}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#10B981" />
              <Text style={styles.whatsappButtonText}>WHATSAPP DA LOJA</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* About Section */}
        {seller?.description && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Sobre o Vendedor</Text>
            <PecaeGlassCard style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{seller.description}</Text>
            </PecaeGlassCard>
          </View>
        )}

        {/* Avaliações Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Avaliações</Text>
            {reviewsResponse?.data?.length > 0 && (
              <TouchableOpacity onPress={() => router.push(`/vendedor/avaliacoes?sellerId=${id}`)}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>

          {reviewsResponse?.data?.length > 0 ? (
            reviewsResponse.data.map((review: any) => (
              <PecaeGlassCard key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.buyerName}>{review.buyerName}</Text>
                  <View style={styles.ratingRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < review.rating ? 'star' : 'star-outline'}
                        size={14}
                        color={i < review.rating ? '#F59E0B' : '#94A3B8'}
                      />
                    ))}
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                </Text>
              </PecaeGlassCard>
            ))
          ) : (
            <PecaeGlassCard style={styles.emptyReviewCard}>
              <Text style={styles.emptyReviewText}>
                Nenhuma avaliação disponível para este vendedor ainda.
              </Text>
            </PecaeGlassCard>
          )}
        </View>

        {/* Listings Section */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Anúncios em Destaque</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {listings && listings.length > 0 ? (
            <View style={styles.listingsGrid}>
              {listings.map((listing: any) => (
                <TouchableOpacity
                  key={listing.id}
                  style={styles.listingCard}
                  onPress={() => router.push(`/anuncio/${listing.id}`)}
                >
                  <View style={styles.listingCardInner}>
                    <View style={styles.listingCardHeader}>
                      <Text style={styles.listingTitle} numberOfLines={2}>
                        {listing.title || 'Sucata'}
                      </Text>
                      {listing.status === 'PUBLISHED' && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>ATIVO</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.listingFooter}>
                      <Ionicons name="chatbubble-outline" size={14} color="#3B82F6" />
                      <Text style={styles.negotiateText}>Negociar via Chat</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <PecaeGlassCard style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="car-outline" size={48} color="rgba(148, 163, 184, 0.3)" />
              </View>
              <Text style={styles.emptyTitle}>Sem anúncios ativos</Text>
              <Text style={styles.emptySubtitle}>
                Este vendedor ainda não publicou anúncios ou está atualizando seu estoque.
              </Text>
            </PecaeGlassCard>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Contact Pill (Optional UI Polish) */}
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif-medium',
  },
  navHeader: {
    height: 100,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingTop: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  blurIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  logoOuterRing: {
    padding: 4,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#F8FAFC',
    fontSize: 48,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 2,
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  storeName: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  infoPills: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  pillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 40,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  whatsappButtonText: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeader: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  seeAllText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionCard: {
    padding: 20,
  },
  descriptionText: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 24,
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listingCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  listingCardInner: {
    padding: 16,
  },
  listingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listingTitle: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  activeBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: '#22C55E',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  listingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  negotiateText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'right',
  },
  emptyReviewCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyReviewText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  }
});
