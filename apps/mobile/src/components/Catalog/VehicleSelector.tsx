import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { usePecaeTheme } from '../../theme';
import { PecaeGlassCard } from '../PecaeUI/PecaeGlassCard';
import { useBrands, useModels, useVersions, useYears } from '../../hooks/useCatalog';
import { Ionicons } from '@expo/vector-icons';

type SelectionLevel = 'brand' | 'model' | 'version' | 'year';

interface VehicleSelectorProps {
  resultsCount?: number;
  onSelect?: (selection: {
    brand: any;
    model: any;
    version: any;
    year: any;
  } | null) => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({ resultsCount = 0, onSelect }) => {
  const { colors, typography, effects } = usePecaeTheme();
  
  const [level, setLevel] = useState<SelectionLevel>('brand');
  const [search, setSearch] = useState('');
  
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<any>(null);

  // Queries
  const { data: brands, isLoading: loadingBrands } = useBrands();
  const { data: models, isLoading: loadingModels } = useModels(selectedBrand?.id);
  const { data: versions, isLoading: loadingVersions } = useVersions(selectedModel?.id);
  const { data: years, isLoading: loadingYears } = useYears(selectedVersion?.id);

  const currentData = useMemo(() => {
    let data = [];
    if (level === 'brand') data = brands || [];
    else if (level === 'model') data = models || [];
    else if (level === 'version') data = versions || [];
    else if (level === 'year') data = years || [];

    if (search) {
      return data.filter((item: any) => {
        if (level === 'year') {
          return `${item.yearFab}/${item.yearModel}`.includes(search);
        }
        return (item.name || '').toLowerCase().includes(search.toLowerCase());
      });
    }
    return data;
  }, [level, brands, years, models, search]);

  const isLoading = loadingBrands || loadingModels || loadingVersions || loadingYears;

  const handleBack = () => {
    setSearch('');
    if (level === 'year') {
      setLevel('version');
    } else if (level === 'version') {
      setLevel('model');
    } else if (level === 'model') {
      setLevel('brand');
    }
  };

  const handleSelect = (item: any) => {
    setSearch('');
    if (level === 'brand') {
      setSelectedBrand(item);
      setLevel('model');
    } else if (level === 'model') {
      setSelectedModel(item);
      setLevel('version');
    } else if (level === 'version') {
      setSelectedVersion(item);
      setLevel('year');
    } else if (level === 'year') {
      setSelectedYear(item);
    }
  };

  const clearSelection = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedVersion(null);
    setSelectedYear(null);
    setLevel('brand');
    setSearch('');
    onSelect?.(null);
  };

  const handleApply = () => {
    onSelect?.({
      brand: selectedBrand,
      model: selectedModel,
      version: selectedVersion,
      year: selectedYear,
    });
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    let itemText = item.name;
    if (level === 'year') {
      itemText = `Fabricação: ${item.yearFab} / Modelo: ${item.yearModel}`;
    }
    
    const isSelected = 
      (level === 'brand' && selectedBrand?.id === item.id) ||
      (level === 'model' && selectedModel?.id === item.id) ||
      (level === 'version' && selectedVersion?.id === item.id) ||
      (level === 'year' && selectedYear?.id === item.id);

    return (
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => handleSelect(item)}
        style={styles.itemContainer}
      >
        <PecaeGlassCard 
          intensity={isSelected ? 30 : 15} 
          style={[
            styles.card, 
            isSelected && { borderColor: colors.brand, borderWidth: 1 }
          ]}
        >
          <View style={styles.itemContent}>
            <Text style={[styles.itemText, { color: colors.textPrimary, fontFamily: typography.body }]}>
              {itemText}
            </Text>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={20} color={colors.brand} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            )}
          </View>
        </PecaeGlassCard>
      </TouchableOpacity>
    );
  }, [level, colors, typography, selectedBrand, selectedModel, selectedVersion, selectedYear]);

  return (
    <View style={styles.container}>
      {/* Breadcrumbs */}
      <View style={styles.breadcrumbs}>
        <TouchableOpacity 
          onPress={() => { setLevel('brand'); }} 
          style={[styles.breadcrumbItem, level === 'brand' && styles.activeBreadcrumb]}
        >
          <Text style={[styles.breadcrumbText, { color: selectedBrand ? colors.brand : colors.textMuted, fontFamily: typography.body }]}>
            {selectedBrand ? selectedBrand.name : 'Marca'}
          </Text>
        </TouchableOpacity>
        
        <Ionicons name="chevron-forward" size={12} color={colors.textMuted} style={styles.crumbSeparator} />
        
        <TouchableOpacity 
          onPress={() => { if (selectedBrand) setLevel('model'); }} 
          style={[styles.breadcrumbItem, level === 'model' && styles.activeBreadcrumb]}
          disabled={!selectedBrand}
        >
          <Text style={[styles.breadcrumbText, { color: selectedModel ? colors.brand : colors.textMuted, fontFamily: typography.body }]}>
            {selectedModel ? selectedModel.name : 'Modelo'}
          </Text>
        </TouchableOpacity>

        <Ionicons name="chevron-forward" size={12} color={colors.textMuted} style={styles.crumbSeparator} />

        <TouchableOpacity 
          onPress={() => { if (selectedModel) setLevel('version'); }} 
          style={[styles.breadcrumbItem, level === 'version' && styles.activeBreadcrumb]}
          disabled={!selectedModel}
        >
          <Text style={[styles.breadcrumbText, { color: selectedVersion ? colors.brand : colors.textMuted, fontFamily: typography.body }]}>
            {selectedVersion ? selectedVersion.name : 'Versão'}
          </Text>
        </TouchableOpacity>
        
        <Ionicons name="chevron-forward" size={12} color={colors.textMuted} style={styles.crumbSeparator} />

        <TouchableOpacity 
          onPress={() => { if (selectedVersion) setLevel('year'); }} 
          style={[styles.breadcrumbItem, level === 'year' && styles.activeBreadcrumb]}
          disabled={!selectedVersion}
        >
          <Text style={[styles.breadcrumbText, { color: selectedYear ? colors.brand : colors.textMuted, fontFamily: typography.body }]}>
            {selectedYear ? `${selectedYear.yearFab}/${selectedYear.yearModel}` : 'Ano'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        {level !== 'brand' && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
          {level === 'brand' ? 'Selecione a Marca' : 
           level === 'model' ? 'Selecione o Modelo' : 
           level === 'version' ? 'Selecione a Versão' : 'Selecione o Ano'}
        </Text>
      </View>



      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item, index) => item.id || `${item.yearFab}-${item.yearModel}` || index.toString()}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.textMuted, fontFamily: typography.body }}>
                Nenhum resultado disponível.
              </Text>
            </View>
          }
        />
      )}

      {/* Action Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          onPress={clearSelection} 
          style={[styles.clearButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.clearButtonText, { color: colors.textPrimary, fontFamily: typography.body }]}>
            Limpar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleApply} 
          style={[styles.applyButton, { backgroundColor: selectedBrand ? colors.brand : colors.surface }]}
          disabled={!selectedBrand}
        >
          <Text style={[styles.applyButtonText, { color: selectedBrand ? '#000' : colors.textMuted, fontFamily: typography.display }]}>
            Ver Resultados ({resultsCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  activeBreadcrumb: {
    backgroundColor: 'rgba(63, 255, 139, 0.1)',
  },
  breadcrumbText: {
    fontSize: 13,
  },
  crumbSeparator: {
    marginHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 18,
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  itemContainer: {
    marginBottom: 8,
  },
  card: {
    padding: 0,
    borderRadius: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  itemText: {
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    backgroundColor: 'rgba(10, 14, 20, 0.95)',
  },
  clearButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 15,
  },
  applyButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    letterSpacing: 1,
  },
});

