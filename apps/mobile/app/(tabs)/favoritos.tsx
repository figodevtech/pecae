import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { PecaeBackground, PecaeGlassCard } from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { useFavorites } from '../../src/hooks/useFavorites';
import { Ionicons } from '@expo/vector-icons';

export default function FavoritesScreen() {
  const { colors, typography, effects } = usePecaeTheme();
  const { getFavorites, toggleFavorite } = useFavorites();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const isWeb = width >= 768;
  const columns = isWeb ? 4 : 2;
  const gap = 12;
  const sidePadding = 20;
  const itemWidth = (width - (sidePadding * 2) - (gap * (columns - 1))) / columns;

  if (getFavorites.isLoading) {
    return (
      <PecaeBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </PecaeBackground>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="heart-dislike-outline" size={64} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
        NADA POR AQUI
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
        Você ainda não salvou nenhum veículo. Explore o marketplace e favorite o que gostar!
      </Text>
      <TouchableOpacity 
        onPress={() => router.push('/(tabs)')}
        style={[styles.exploreButton, { backgroundColor: colors.brand, borderRadius: effects.radius.md }]}
      >
        <Text style={[styles.exploreButtonText, { fontFamily: typography.display, color: '#000' }]}>
          EXPLORAR AGORA
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <PecaeBackground>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
          MEUS FAVORITOS
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
          {getFavorites.data?.length || 0} veículos salvos
        </Text>
      </View>

      <FlatList
        data={getFavorites.data || []}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        key={columns} // Force re-render when columns change
        contentContainerStyle={[styles.listContent, isWeb && styles.webListContent]}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, { width: itemWidth }]}>
            <TouchableOpacity 
              onPress={() => router.push(`/(tabs)/vehicle/${item.id}`)}
              activeOpacity={0.7}
            >
              <PecaeGlassCard intensity={15} style={styles.productCard}>
                <Image 
                  source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80' }} 
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.heartBtn}
                  onPress={() => toggleFavorite.mutate(item.id)}
                >
                  <Ionicons name="heart" size={20} color={colors.brand} />
                </TouchableOpacity>
                
                <View style={styles.productInfo}>
                  <Text style={[styles.productBrand, { color: colors.brand, fontFamily: typography.body }]} numberOfLines={1}>
                    {item.brand?.toUpperCase() || 'VEÍCULO'}
                  </Text>
                  <Text style={[styles.productTitle, { color: colors.textPrimary, fontFamily: typography.medium }]} numberOfLines={2}>
                    {item.model} {item.version}
                  </Text>
                  <View style={styles.productFooter}>
                    <Text style={[styles.productLocation, { color: colors.textMuted, fontFamily: typography.body }]}>
                      📍 {item.city}
                    </Text>
                  </View>
                </View>
              </PecaeGlassCard>
            </TouchableOpacity>
          </View>
        )}
      />
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  webListContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  cardWrapper: {
    marginBottom: 16,
    marginRight: 12,
  },
  productCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productBrand: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 2,
  },
  productTitle: {
    fontSize: 13,
    lineHeight: 18,
    height: 36,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productLocation: {
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    letterSpacing: 2,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
    marginBottom: 32,
  },
  exploreButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  exploreButtonText: {
    fontSize: 14,
    letterSpacing: 1,
  },
});
