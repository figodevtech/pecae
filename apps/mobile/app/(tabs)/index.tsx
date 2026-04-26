import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import { PecaeBackground, PecaeGlassCard } from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { useListings } from '../../src/hooks/useVehicles';
import { useUIStore } from '../../src/store/ui-store';
import { getVehicleImage } from '../../src/utils/vehicleImages';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BuyerHomeScreen() {
  const { colors, typography, effects } = usePecaeTheme();
  const { viewMode, themeMode, setViewMode, setThemeMode, initializeUI } = useUIStore();
  const { data: listings, isLoading } = useListings();
  const { width } = useWindowDimensions();
  const router = useRouter();

  useEffect(() => {
    initializeUI();
  }, []);

  const toggleTheme = () => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const isWeb = width >= 768;
  const columns = viewMode === 'grid' ? (isWeb ? 4 : 2) : 1;
  const gap = 16;
  const horizontalPadding = 24;
  const availableWidth = width - (horizontalPadding * 2) - (gap * (columns - 1));
  const itemWidth = Math.floor(availableWidth / columns);

  const navigateToDetails = (id: string) => {
    router.push(`/(tabs)/vehicle/${id}`);
  };

  return (
    <PecaeBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
              PECAÊ // TERMINAL
            </Text>
            <View style={styles.controls}>
              <TouchableOpacity 
                onPress={toggleTheme} 
                style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                accessibilityLabel="Alternar Tema"
              >
                <Ionicons 
                  name={themeMode === 'dark' ? 'sunny' : 'moon'} 
                  size={20} 
                  color={colors.brand} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={toggleViewMode} 
                style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                accessibilityLabel="Alternar Visualização"
              >
                <Ionicons 
                  name={viewMode === 'grid' ? 'list' : 'grid'} 
                  size={20} 
                  color={colors.brand} 
                />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
            Sincronizado com a Rede de Peças Automotivas.
          </Text>
        </View>

        <PecaeGlassCard intensity={20} style={[styles.card, { borderRadius: effects.radius.md }]}>
          <Text style={[styles.cardTitle, { color: colors.brand, fontFamily: typography.display }]}>
            SISTEMA OPERACIONAL
          </Text>
          <Text style={[styles.cardText, { color: colors.textPrimary, fontFamily: typography.body }]}>
            Bem-vindo ao terminal de busca. Encontre componentes e veículos com procedência verificada.
          </Text>
        </PecaeGlassCard>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 20 }} />
        ) : (
          <View style={[viewMode === 'grid' ? (isWeb ? styles.webGrid : styles.gridContainer) : styles.listContainer, { gap }]}>
            {listings && listings.length > 0 ? (
              listings.map((vehicle: any) => {
                const brand = vehicle.listing?.brand || vehicle.version?.model?.brand?.name || '';
                const model = vehicle.listing?.model || vehicle.version?.model?.name || '';
                const imageUrl = getVehicleImage(brand, model, vehicle.id);
                const title = vehicle.listing?.title || `${brand} ${model}`.trim() || 'Veículo';
                
                // Mocks for badges
                const isVerified = vehicle.id.charCodeAt(0) % 2 === 0;
                const isFeatured = vehicle.id.charCodeAt(1) % 2 === 0;

                if (viewMode === 'grid') {
                  return (
                    <TouchableOpacity 
                      key={vehicle.id} 
                      onPress={() => navigateToDetails(vehicle.id)}
                      style={{ width: isWeb ? '100%' : itemWidth }}
                      activeOpacity={0.8}
                    >
                      <PecaeGlassCard intensity={15} style={[styles.gridItem, { borderRadius: effects.radius.md }]}>
                        <View style={styles.imageWrapper}>
                          <Image 
                            source={{ uri: imageUrl }} 
                            style={styles.gridImage} 
                            resizeMode="cover"
                          />
                          <View style={styles.badgeContainer}>
                            {isFeatured && (
                              <View style={[styles.badge, { backgroundColor: colors.vibrant }]}>
                                <Text style={[styles.badgeText, { color: colors.dark, fontFamily: typography.display }]}>
                                  DESTAQUE
                                </Text>
                              </View>
                            )}
                            {isVerified && (
                              <View style={[styles.badge, { backgroundColor: colors.brand }]}>
                                <Text style={[styles.badgeText, { color: '#FFF', fontFamily: typography.display }]}>
                                  ✓ VERIFICADO
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.cardContent}>
                          <Text 
                            style={[styles.itemTitle, { color: colors.textPrimary, fontFamily: typography.display }]}
                            numberOfLines={2}
                          >
                            {title}
                          </Text>
                          
                          <Text style={[styles.itemDetails, { color: colors.textMuted, fontFamily: typography.body }]}>
                            📍 {vehicle.city} - {vehicle.state}
                          </Text>

                          {vehicle.color && (
                            <Text style={[styles.itemDetails, { color: colors.textMuted, fontFamily: typography.body }]}>
                              🎨 Cor: {vehicle.color}
                            </Text>
                          )}

                          {vehicle.listing?.views !== undefined && (
                            <Text style={[styles.itemDetails, { color: colors.textMuted, fontFamily: typography.body }]}>
                              👁️ {vehicle.listing.views} views
                            </Text>
                          )}
                        </View>
                      </PecaeGlassCard>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity 
                    key={vehicle.id} 
                    onPress={() => navigateToDetails(vehicle.id)}
                    style={{ width: '100%' }}
                    activeOpacity={0.8}
                  >
                    <PecaeGlassCard intensity={15} style={[styles.listItem, { borderRadius: effects.radius.md }]}>
                      <View style={styles.listImageWrapper}>
                        <Image 
                          source={{ uri: imageUrl }} 
                          style={styles.listImage} 
                          resizeMode="cover"
                        />
                        <View style={styles.badgeContainer}>
                          {isFeatured && (
                            <View style={[styles.badge, { backgroundColor: colors.vibrant }]}>
                              <Text style={[styles.badgeText, { color: colors.dark, fontFamily: typography.display }]}>
                                DESTAQUE
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.listContent}>
                        <Text 
                          style={[styles.itemTitle, { color: colors.textPrimary, fontFamily: typography.display }]}
                          numberOfLines={2}
                        >
                          {title}
                        </Text>

                        {isVerified && (
                          <Text style={[styles.verifiedLabel, { color: colors.brand, fontFamily: typography.medium }]}>
                            ✓ Vendedor Verificado
                          </Text>
                        )}

                        <Text style={[styles.itemDetails, { color: colors.textMuted, fontFamily: typography.body, marginTop: 4 }]}>
                          📍 {vehicle.city} - {vehicle.state}
                        </Text>

                        {vehicle.color && (
                          <Text style={[styles.itemDetails, { color: colors.textMuted, fontFamily: typography.body }]}>
                            🎨 Cor: {vehicle.color}
                          </Text>
                        )}

                        {vehicle.listing?.views !== undefined && (
                          <Text style={[styles.itemDetails, { color: colors.textMuted, fontFamily: typography.body }]}>
                            👁️ {vehicle.listing.views} visualizações
                          </Text>
                        )}
                      </View>
                    </PecaeGlassCard>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={[styles.cardText, { color: colors.textMuted, fontFamily: typography.body, width: '100%', textAlign: 'center', marginTop: 20 }]}>
                Nenhum veículo disponível no momento.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    letterSpacing: 4,
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.6,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  card: {
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 8,
    letterSpacing: 2,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  webGrid: {
    display: 'grid' as any,
    gridTemplateColumns: 'repeat(4, 1fr)' as any,
  },
  listContainer: {
    flexDirection: 'column',
  },
  gridItem: {
    padding: 0,
    overflow: 'hidden',
    height: '100%',
  },
  listItem: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  listImageWrapper: {
    width: 140,
    height: 140,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardContent: {
    padding: 12,
    gap: 4,
  },
  listContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    opacity: 0.8,
  },
  verifiedLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});


