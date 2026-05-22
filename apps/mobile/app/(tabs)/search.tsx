import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  useWindowDimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  PecaeBackground, 
  PecaeGlassCard 
} from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { useSearchVehicles, useSearchSuggestions } from '../../src/hooks/useVehicles';
import { useSavedSearches } from '../../src/hooks/useSavedSearches';
import { useRouter } from 'expo-router';
import { SponsoredListingCard } from '../../src/components/Ads/SponsoredListingCard';

const QUICK_FILTERS = [
  { id: 'all', label: 'Todos', icon: 'apps-outline' },
  { id: 'fiat', label: 'Fiat', icon: 'car-sport-outline' },
  { id: 'vw', label: 'VW', icon: 'car-sport-outline' },
  { id: 'chevrolet', label: 'GM', icon: 'car-sport-outline' },
  { id: 'sucata', label: 'Sucata', icon: 'hammer-outline' },
  { id: 'inteiro', label: 'Inteiro', icon: 'shield-checkmark-outline' },
];

export default function SearchScreen() {
  const { colors, typography } = usePecaeTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Hook de buscas salvas
  const { saveSearch } = useSavedSearches();

  // Efeito de Debounce (300ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchText]);

  // Hook de Sugestões de Busca
  const { data: suggestions = [] } = useSearchSuggestions(searchText);

  // Integração com API (usando debouncedSearchText)
  const { data: searchResponse, isLoading } = useSearchVehicles({
    q: debouncedSearchText,
    brandId: activeFilter !== 'all' ? activeFilter : undefined,
    city: city || undefined,
    state: state || undefined,
  });

  const results = searchResponse?.data || [];

  const handleSaveSearch = async () => {
    try {
      await saveSearch.mutateAsync({
        query: debouncedSearchText,
        filters: {
          brandId: activeFilter !== 'all' ? activeFilter : undefined,
          city: city || undefined,
          state: state || undefined,
        },
        alertActive: true,
      });
      alert('Busca salva com sucesso! Você será notificado quando novos doadores semelhantes entrarem no estoque.');
    } catch (error: any) {
      if (error?.response?.status === 401) {
        alert('Apenas usuários autenticados podem salvar buscas. Por favor, faça login ou cadastre-se.');
      } else {
        alert('Erro ao salvar busca. Tente novamente mais tarde.');
      }
    }
  };

  // Lógica de Grid Responsivo
  const isWeb = width >= 768;
  const columns = isWeb ? 4 : 2;
  const gap = 12;
  const horizontalPadding = 20;
  const itemWidth = (width - (horizontalPadding * 2) - (gap * (columns - 1))) / columns;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search-outline" size={48} color={colors.border} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
        {debouncedSearchText ? 'NENHUM RESULTADO' : 'EXPLORE A FORJA'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
        {debouncedSearchText 
          ? `Não encontramos nada para "${debouncedSearchText}". Tente termos mais genéricos.`
          : 'Busque por peças, modelos ou marcas específicas no inventário.'}
      </Text>
      {debouncedSearchText && (
        <TouchableOpacity 
          style={[styles.saveSearchBtn, { backgroundColor: colors.brand, borderColor: colors.brand }]}
          onPress={handleSaveSearch}
          disabled={saveSearch.isPending}
        >
          {saveSearch.isPending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Ionicons name="notifications-outline" size={16} color="#000" style={{ marginRight: 8 }} />
              <Text style={[styles.saveSearchBtnText, { fontFamily: typography.display }]}>
                NOTIFICAR-ME SE CHEGAR
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <PecaeBackground>
      {/* Search Header HUD */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1 }]}>
            <Ionicons name="search" size={20} color={colors.brand} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary, fontFamily: typography.body }]}
              placeholder="O que você está procurando?"
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              autoFocus={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.filterToggle, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={24} color={showFilters ? colors.brand : colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <PecaeGlassCard intensity={25} style={styles.suggestionsContainer}>
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.suggestionsScroll}>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={`${suggestion.type}-${suggestion.id}`}
                  style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    if (suggestion.type === 'BRAND') {
                      setActiveFilter(suggestion.text.toLowerCase());
                      setSearchText('');
                    } else {
                      setSearchText(suggestion.text);
                    }
                    setShowSuggestions(false);
                  }}
                >
                  <Ionicons 
                    name={suggestion.type === 'BRAND' ? 'car-sport-outline' : 'pricetag-outline'} 
                    size={16} 
                    color={colors.brand} 
                  />
                  <View style={styles.suggestionTextContainer}>
                    <Text style={[styles.suggestionText, { color: colors.textPrimary, fontFamily: typography.medium }]}>
                      {suggestion.text}
                    </Text>
                    <Text style={[styles.suggestionType, { color: colors.textMuted, fontFamily: typography.body }]}>
                      {suggestion.type === 'BRAND' ? 'Marca' : 'Modelo'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </PecaeGlassCard>
        )}

        {showFilters && (
          <View style={styles.advancedFilters}>
            <View style={styles.filterRow}>
              <View style={[styles.filterInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={{ color: colors.textPrimary, flex: 1, fontSize: 12 }}
                  placeholder="Cidade"
                  placeholderTextColor={colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={[styles.filterInput, { backgroundColor: colors.surface, borderColor: colors.border, width: 60 }]}>
                <TextInput
                  style={{ color: colors.textPrimary, flex: 1, fontSize: 12, textAlign: 'center' }}
                  placeholder="UF"
                  placeholderTextColor={colors.textMuted}
                  value={state}
                  onChangeText={(val) => setState(val.toUpperCase().substring(0, 2))}
                  maxLength={2}
                />
              </View>
              <TouchableOpacity onPress={() => { setCity(''); setState(''); }}>
                <Text style={{ color: colors.brand, fontSize: 12 }}>Limpar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Filtros Rápidos Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filtersScroll}
        >
          {QUICK_FILTERS.map((filter) => {
            const isSelected = activeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  { 
                    backgroundColor: isSelected ? colors.brand : colors.surface,
                    borderColor: isSelected ? colors.brand : colors.border
                  }
                ]}
                onPress={() => setActiveFilter(filter.id)}
              >
                <Ionicons 
                  name={filter.icon as any} 
                  size={16} 
                  color={isSelected ? '#000' : colors.textPrimary} 
                />
                <Text 
                  style={[
                    styles.filterLabel, 
                    { 
                      color: isSelected ? '#000' : colors.textPrimary,
                      fontFamily: typography.medium
                    }
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={[styles.loaderText, { color: colors.textMuted, fontFamily: typography.body }]}>
              VASCULHANDO O ESTOQUE...
            </Text>
          </View>
        ) : results.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.resultsGrid}>
            {results.map((vehicle: any, index: number) => {
              if (vehicle.isSponsored) {
                return (
                  <SponsoredListingCard
                    key={`sponsored-${vehicle.id}`}
                    vehicle={vehicle}
                    itemWidth={itemWidth}
                  />
                );
              }

              const brand = vehicle.version?.model?.brand?.name || '';
              const model = vehicle.version?.model?.name || '';
              const imageUrl = vehicle.thumbnail || (vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos[0] : null);
              const isMatch = index === 0 && searchText.length > 2; // Simulação de match destacado

              return (
                <TouchableOpacity 
                  key={vehicle.id} 
                  style={[styles.productCardWrapper, { width: itemWidth }]}
                  onPress={() => router.push(`/(tabs)/vehicle/${vehicle.id}`)}
                >
                  <View style={styles.imageOverlapContainer}>
                    <PecaeGlassCard padding={0} intensity={15} pulse={isMatch} style={styles.productCard}>
                      <View style={styles.imagePlaceholder} />
                      <View style={styles.productInfo}>
                        <Text style={[styles.brandLabel, { color: colors.brand, fontFamily: typography.display }]}>
                          {brand.toUpperCase()}
                        </Text>
                        <Text style={[styles.productTitle, { color: colors.textPrimary, fontFamily: typography.display }]} numberOfLines={1}>
                          {model.toUpperCase()}
                        </Text>
                        
                        <View style={styles.productFooter}>
                          <Ionicons name="location-outline" size={10} color={colors.textMuted} />
                          <Text style={[styles.productLocation, { color: colors.textMuted, fontFamily: typography.medium }]} numberOfLines={1}>
                            {vehicle.city?.toUpperCase()}/{vehicle.state?.toUpperCase()}
                          </Text>
                        </View>

                        <View style={[styles.viewDetailsBtn, { backgroundColor: isMatch ? `${colors.brand}15` : 'rgba(255, 255, 255, 0.05)', borderColor: colors.brand }]}>
                          <Text style={{ color: colors.brand, fontSize: 10, fontFamily: typography.display }}>
                            {isMatch ? 'VER MATCH' : 'ACESSAR FORJA'}
                          </Text>
                        </View>
                      </View>
                    </PecaeGlassCard>
                    
                    {/* Floating Image Overlap Effect */}
                    <View style={styles.floatingImageContainer}>
                      {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.floatingImage} resizeMode="contain" />
                      ) : (
                        <View style={[styles.floatingImage, { backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="car-outline" size={40} color={colors.border} />
                        </View>
                      )}
                    </View>
                    
                    <View style={[styles.badge, { backgroundColor: isMatch ? colors.vibrant : colors.brand }]}>
                      <Text style={styles.badgeText}>{isMatch ? 'MATCH' : 'DOADOR'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    gap: 10,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
  },
  filterToggle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  advancedFilters: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterInput: {
    flex: 1,
    height: 35,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 10,
    letterSpacing: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: {
    fontSize: 20,
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  productCardWrapper: {
    marginBottom: 24,
  },
  imageOverlapContainer: {
    position: 'relative',
    paddingTop: 40,
  },
  productCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  imagePlaceholder: {
    height: 100,
  },
  floatingImageContainer: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 140,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingImage: {
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  badge: {
    position: 'absolute',
    top: 50,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 20,
  },
  badgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 16,
    paddingTop: 0,
    gap: 4,
  },
  brandLabel: {
    fontSize: 10,
    letterSpacing: 2,
    opacity: 0.7,
  },
  productTitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  productLocation: {
    fontSize: 10,
  },
  viewDetailsBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  saveSearchBtnText: {
    color: '#000',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    left: 20,
    right: 80,
    maxHeight: 250,
    borderRadius: 16,
    zIndex: 1000,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  suggestionsScroll: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  suggestionTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 14,
  },
  suggestionType: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
