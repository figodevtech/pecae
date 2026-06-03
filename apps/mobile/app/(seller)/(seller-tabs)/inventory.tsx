import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { PecaeBackground, PecaeGlassCard, StatWidget } from '../../../src/components/PecaeUI';
import { usePecaeTheme } from '../../../src/theme';
import { useRouter } from 'expo-router';
import { useVehicles } from '../../../src/hooks/useVehicles';
import { VehicleInventoryCard } from '../../../src/components/VehicleWizard/VehicleInventoryCard';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function InventoryScreen() {
  const { colors, typography, isDark, effects } = usePecaeTheme();
  const router = useRouter();
  const { data: vehicles, isLoading, refetch } = useVehicles();
  const [search, setSearch] = useState('');

  // Stats computation
  const stats = useMemo(() => {
    if (!vehicles) return { total: 0, active: 0, sold: 0 };
    return {
      total: vehicles.length,
      active: vehicles.filter(v => v.status === 'ACTIVE').length,
      sold: vehicles.filter(v => v.status === 'SOLD').length
    };
  }, [vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    if (!search) return vehicles;
    const s = search.toLowerCase();
    return vehicles.filter(v => 
      v.brand.toLowerCase().includes(s) || 
      v.model.toLowerCase().includes(s) || 
      v.version.toLowerCase().includes(s)
    );
  }, [vehicles, search]);

  return (
    <PecaeBackground>
      <View style={styles.container}>
        {/* Sticky Header with Search */}
        <BlurView intensity={isDark ? 30 : 50} style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
                MEU INVENTÁRIO
              </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(seller)/cadastrar-sucata')}
                style={[styles.addButton, { backgroundColor: colors.brand }]}
              >
                <Ionicons name="add" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary, fontFamily: typography.body }]}
                placeholder="Buscar por marca, modelo..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </BlurView>

        <FlatList
          data={filteredVehicles}
          renderItem={({ item }) => <VehicleInventoryCard vehicle={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.statsRow}>
              <StatWidget 
                label="TOTAL" 
                value={stats.total.toString()} 
                icon="car-outline" 
                style={styles.stat}
              />
              <StatWidget 
                label="ATIVOS" 
                value={stats.active.toString()} 
                icon="checkmark-circle-outline" 
                style={styles.stat}
              />
              <StatWidget 
                label="VENDIDOS" 
                value={stats.sold.toString()} 
                icon="cart-outline" 
                style={styles.stat}
              />
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.brand} />
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.brand} />
              </View>
            ) : (
              <View style={styles.center}>
                <Ionicons name="car-sport-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  {search ? 'Nenhum veículo encontrado para esta busca.' : 'Você ainda não possui veículos cadastrados.'}
                </Text>
                {!search && (
                  <TouchableOpacity 
                    style={[styles.emptyCta, { borderColor: colors.brand }]}
                    onPress={() => router.push('/(seller)/cadastrar-sucata')}
                  >
                    <Text style={[styles.emptyCtaText, { color: colors.brand, fontFamily: typography.medium }]}>
                      CADASTRAR PRIMEIRO VEÍCULO
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />
      </View>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlur: {
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    gap: 15,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    letterSpacing: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },
  stat: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    lineHeight: 24,
  },
  emptyCta: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyCtaText: {
    fontSize: 12,
    letterSpacing: 1,
  },
});
