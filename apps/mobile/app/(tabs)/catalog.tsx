import React, { useState } from 'react';
import { StyleSheet, View, FlatList, Text, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { VehicleSelector } from '../../src/components/Catalog';
import { PecaeScreenContainer } from '../../src/components/PecaeUI/PecaeScreenContainer';
import { PecaeBackground } from '../../src/components/PecaeUI/PecaeBackground';
import { PecaeGlassCard } from '../../src/components/PecaeUI/PecaeGlassCard';
import { usePecaeTheme } from '../../src/theme';
import { useSearchVehicles, VehicleDonor } from '../../src/hooks/useVehicles';
import { Ionicons } from '@expo/vector-icons';

export default function CatalogScreen() {
  const { colors, typography } = usePecaeTheme();
  const router = useRouter();
  const [filters, setFilters] = useState<any>(null);
  const [isSelecting, setIsSelecting] = useState(true);

  const { data, isLoading } = useSearchVehicles(filters);

  const handleSelect = (selection: any) => {
    if (!selection) {
      setFilters(null);
      return;
    }
    
    setFilters({
      brandId: selection.brand?.id,
      modelId: selection.model?.id,
      versionId: selection.version?.id,
      yearMin: selection.year?.yearFab,
      yearMax: selection.year?.yearFab,
    });
    setIsSelecting(false);
  };

  const renderVehicle = ({ item }: { item: VehicleDonor }) => (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => router.push(`/(tabs)/vehicle/${item.id}`)}
      style={styles.cardWrapper}
    >
      <PecaeGlassCard style={styles.vehicleCard} intensity={20}>
        <Image 
          source={{ uri: item.thumbnail || 'https://via.placeholder.com/400x300?text=Sem+Foto' }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.brandText, { color: colors.brand, fontFamily: typography.bold }]}>
              {item.brand}
            </Text>
            <View style={[styles.badge, { backgroundColor: 'rgba(63, 255, 139, 0.1)' }]}>
              <Text style={[styles.badgeText, { color: colors.brand }]}>DOADOR</Text>
            </View>
          </View>
          
          <Text style={[styles.modelText, { color: colors.textPrimary, fontFamily: typography.display }]}>
            {item.model} {item.version}
          </Text>
          
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.specText, { color: colors.textMuted }]}>{item.yearFab}</Text>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="color-palette-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.specText, { color: colors.textMuted }]}>{item.color}</Text>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.specText, { color: colors.textMuted }]}>{item.city}/{item.state}</Text>
            </View>
          </View>

          <View style={[styles.inventoryTag, { borderTopColor: colors.border }]}>
            <Ionicons name="layers-outline" size={14} color={colors.brand} />
            <Text style={[styles.inventoryText, { color: colors.textPrimary, fontFamily: typography.bold }]}>
              {item.availablePartsCount} peças disponíveis
            </Text>
          </View>
        </View>
      </PecaeGlassCard>
    </TouchableOpacity>
  );

  return (
    <PecaeBackground>
      <PecaeScreenContainer>
        <Stack.Screen 
          options={{ 
            title: 'Catálogo',
            headerShown: false 
          }} 
        />
        
        <View style={styles.container}>
          {isSelecting ? (
            <VehicleSelector onSelect={handleSelect} />
          ) : (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <TouchableOpacity 
                  onPress={() => setIsSelecting(true)}
                  style={styles.backButton}
                >
                  <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.resultsTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                  Sucatas Disponíveis
                </Text>
              </View>

              {isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={colors.brand} />
                </View>
              ) : (
                <FlatList
                  data={data?.data || []}
                  renderItem={renderVehicle}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    <View style={styles.center}>
                      <Ionicons name="car-sport-outline" size={64} color={colors.textMuted} />
                      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        Nenhum veículo doador encontrado para este modelo.
                      </Text>
                      <TouchableOpacity 
                        onPress={() => setIsSelecting(true)}
                        style={[styles.retryButton, { borderColor: colors.brand }]}
                      >
                        <Text style={{ color: colors.brand }}>Tentar outro modelo</Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              )}
            </View>
          )}
        </View>
      </PecaeScreenContainer>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    marginRight: 10,
  },
  resultsTitle: {
    fontSize: 20,
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  vehicleCard: {
    padding: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  modelText: {
    fontSize: 18,
    marginBottom: 12,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 12,
  },
  inventoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  inventoryText: {
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
