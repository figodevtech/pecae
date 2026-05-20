import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../src/hooks/useFavorites';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';

export default function FavoritosScreen() {
  const router = useRouter();
  const { colors, typography, isDark, spacing } = usePecaeTheme();
  const { getFavorites, toggleFavorite } = useFavorites();

  const handleToggleFavorite = (listingId: string) => {
    toggleFavorite.mutate(listingId);
  };

  const renderItem = ({ item }: { item: any }) => {
    const listing = item.listing;
    if (!listing) return null;

    // Dados de localização e nome vêm do vehicle relacionado (Listing não tem city/state/price)
    const vehicle = listing.vehicle;
    const locationText = vehicle ? `${vehicle.city}, ${vehicle.state}` : null;
    const modelName = vehicle?.version?.model
      ? `${vehicle.version.model.brand?.name ?? ''} ${vehicle.version.model.name}`
      : listing.title;

    return (
      <PecaeGlassCard
        style={styles.card}
        intensity={isDark ? 10 : 35}
      >
        <TouchableOpacity
          style={styles.cardInner}
          onPress={() => router.push(`/(tabs)/vehicle/${listing.id}`)}
        >
          <View style={styles.cardInfo}>
            <Text
              style={[styles.cardTitle, { color: colors.textPrimary, fontFamily: typography.display }]}
              numberOfLines={2}
            >
              {modelName || listing.title || 'Anúncio sem título'}
            </Text>
            {/* RN04: Plataforma não exibe preços — negociação exclusivamente via chat */}
            <View style={styles.priceRow}>
              <Text style={[styles.cardPrice, { color: colors.brand, fontFamily: typography.mono }]}>
                Negociar via Chat
              </Text>
            </View>
            {locationText && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                <Text style={[styles.locationText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  {locationText}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.favoriteButton, { backgroundColor: colors.error + '15' }]}
            onPress={() => handleToggleFavorite(listing.id)}
          >
            <Ionicons name="heart" size={20} color={colors.error} />
          </TouchableOpacity>
        </TouchableOpacity>
      </PecaeGlassCard>
    );
  };

  return (
    <PecaeBackground>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Meus Favoritos',
            headerTransparent: true,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontFamily: typography.display, fontSize: 18 },
          }}
        />

        <View style={styles.headerSpacer} />

        {getFavorites.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : getFavorites.isError ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.textPrimary, fontFamily: typography.display }]}>
              Ops! Algo deu errado
            </Text>
            <Text style={[styles.errorSubtext, { color: colors.textMuted, fontFamily: typography.body }]}>
              Não foi possível carregar seus favoritos.
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.brand }]}
              onPress={() => getFavorites.refetch()}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={getFavorites.data || []}
            renderItem={renderItem}
            estimatedItemSize={120}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.brand + '10' }]}>
                  <Ionicons name="heart-outline" size={48} color={colors.brand} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  Nenhum favorito ainda
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Salve anúncios que você gostou para vê-los aqui mais tarde.
                </Text>
                <TouchableOpacity 
                  style={[styles.browseButton, { backgroundColor: colors.brand }]}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.browseButtonText}>Explorar Marketplace</Text>
                </TouchableOpacity>
              </View>
            }
            refreshing={getFavorites.isFetching}
            onRefresh={getFavorites.refetch}
          />
        )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
    padding: 0,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },
  priceRow: {
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    opacity: 0.8,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
    lineHeight: 22,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  browseButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
