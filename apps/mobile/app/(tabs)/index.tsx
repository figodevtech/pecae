import React, { useEffect, useState, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, useWindowDimensions, TextInput, Animated, Alert } from 'react-native';
import { PecaeBackground, PecaeGlassCard } from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { useSearchVehicles } from '../../src/hooks/useVehicles';
import { useAuthStore } from '../../src/store/auth-store';
import { getVehicleImage } from '../../src/utils/vehicleImages';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SearchFilterModal } from '../../src/components/Search/SearchFilterModal';

const CATEGORIES = [
  { id: '1', name: 'Carros Sucata', icon: 'car-outline' },
  { id: '2', name: 'Motos Sucata', icon: 'bicycle-outline' },
  { id: '3', name: 'Caminhões', icon: 'bus-outline' },
  { id: '4', name: 'Maquinário', icon: 'construct-outline' },
  { id: '5', name: 'Leilões', icon: 'hammer-outline' },
];

export default function BuyerHomeScreen() {
  const { colors, typography, effects } = usePecaeTheme();
  const [searchText, setSearchText] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<{ brandId?: string; modelId?: string; yearFabId?: string }>({});

  const { data: searchResponse, isLoading } = useSearchVehicles({ 
    q: activeQuery || activeCategory,
    ...filters
  });
  const listings = searchResponse?.data || [];
  const { width } = useWindowDimensions();
  const router = useRouter();

  const handleSearch = () => {
    setActiveQuery(searchText);
  };

  const handleProfilePress = () => {
    Alert.alert(
      "Perfil",
      "O que você deseja fazer?",
      [
        { text: "Ver Perfil", onPress: () => router.push('/(buyer)/perfil') },
        { 
          text: "Sair da Conta", 
          onPress: async () => {
            await useAuthStore.getState().clearAuth();
            router.replace('/(auth)/login');
          }, 
          style: 'destructive' 
        },
        { text: "Cancelar", style: 'cancel' }
      ]
    );
  };

  const isWeb = width >= 768;
  const columns = isWeb ? 4 : 2;
  const gap = 12;
  const horizontalPadding = 20;
  const itemWidth = (width - (horizontalPadding * 2) - (gap * (columns - 1))) / columns;

  return (
    <PecaeBackground>
      {/* Header Fixo */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          {/* Logo Estilizado */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: colors.brand }]} />
            <Text style={[styles.logoText, { color: colors.textPrimary, fontFamily: typography.display }]}>PEÇAÊ</Text>
          </View>

          {/* Barra de Busca Arredondada */}
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity onPress={handleSearch}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary, fontFamily: typography.body }]}
              placeholder="Busca rápida de veículos..."
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity 
              onPress={() => setIsFilterModalVisible(true)}
              style={[
                styles.filterBtn, 
                Object.keys(filters).length > 0 && { backgroundColor: 'rgba(63, 255, 139, 0.1)' }
              ]}
            >
              <Ionicons 
                name="options-outline" 
                size={18} 
                color={Object.keys(filters).length > 0 ? colors.brand : colors.textMuted} 
              />
            </TouchableOpacity>
          </View>

          {/* Ações Direitas */}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/notificacoes')} style={styles.actionBtn}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/mensagens')} style={styles.actionBtn}>
              <View>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.textPrimary} />
                <View style={[styles.badge, { backgroundColor: colors.error }]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Carrossel de Categorias */}
        <View style={styles.categoriesSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.categoriesScroll,
              { flexGrow: 1, justifyContent: 'center' }
            ]}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={[
                  styles.categoryItem,
                  activeCategory === cat.name && { opacity: 0.7 }
                ]}
                onPress={() => {
                  if (activeCategory === cat.name) {
                    setActiveCategory(undefined);
                  } else {
                    setActiveCategory(cat.name);
                    setActiveQuery('');
                    setSearchText('');
                  }
                }}
              >
                <View style={[
                  styles.categoryCircle, 
                  { backgroundColor: colors.surface, shadowColor: '#000' },
                  activeCategory === cat.name && { borderColor: colors.brand, borderWidth: 2 }
                ]}>
                  <Ionicons name={cat.icon as any} size={28} color={activeCategory === cat.name ? colors.brand : colors.textMuted} />
                </View>
                <Text style={[
                  styles.categoryLabel, 
                  { color: activeCategory === cat.name ? colors.brand : colors.textPrimary, fontFamily: typography.medium }
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Seção de Recomendações */}
        <View style={styles.recommendationsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
            Recomendado para Você
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.productGrid}>
            {listings.map((vehicle: any) => {
              const getSafeText = (val: any) => {
                if (!val) return '';
                if (typeof val === 'string') return val;
                return val.name || '';
              };
              
              const brand = getSafeText(vehicle.brand);
              const model = getSafeText(vehicle.model);
              const imageUrl = getVehicleImage(brand, model, vehicle.id);
              
              // Título composto: marca - modelo - (ano fabricação/anomodelo)
              const yearFab = vehicle.yearFab || '--';
              const yearModel = vehicle.yearModel || yearFab;
              const title = `${brand} - ${model} - (${yearFab}/${yearModel})`.trim() || 'Veículo sem título';
              
              return (
                <TouchableOpacity 
                  key={vehicle.id} 
                  style={[styles.productCardWrapper, { width: itemWidth }]}
                  onPress={() => router.push(`/(tabs)/vehicle/${vehicle.id}`)}
                >
                  <PecaeGlassCard intensity={10} style={styles.productCard}>
                    <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
                    <View style={styles.productInfo}>
                      <Text style={[styles.productTitle, { color: colors.textPrimary, fontFamily: typography.display }]} numberOfLines={2}>
                        {title}
                      </Text>
                      <View style={styles.productFooter}>
                        <Text style={[styles.productLocation, { color: colors.textMuted }]}>
                          📍 {vehicle.city || vehicle.seller?.city || 'Brasil'}/{vehicle.state || vehicle.seller?.state || '--'}
                        </Text>
                        <Text style={[styles.productTime, { color: colors.textMuted }]}>
                          Há 2 horas
                        </Text>
                      </View>
                    </View>
                  </PecaeGlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <SearchFilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        initialFilters={filters}
      />
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    transform: [{ rotate: '15deg' }],
  },
  logoText: {
    fontSize: 16,
    letterSpacing: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
  },
  filterBtn: {
    padding: 6,
    borderRadius: 8,
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  categoriesSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 20,
    minWidth: '100%',
    justifyContent: 'center',
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
    width: 70,
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  recommendationsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: 1,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  productCardWrapper: {
    marginBottom: 12,
  },
  productCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productInfo: {
    padding: 10,
    gap: 4,
  },
  productTitle: {
    fontSize: 12,
    lineHeight: 16,
    height: 32,
  },
  productPrice: {
    fontSize: 16,
    marginTop: 2,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productLocation: {
    fontSize: 8,
  },
  productTime: {
    fontSize: 8,
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
  fabText: {
    fontSize: 12,
    letterSpacing: 1,
  },
});


