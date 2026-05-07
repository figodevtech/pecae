import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../theme';
import { PecaeButton } from '../PecaeUI/PecaeButton';
import { PecaeGlassCard } from '../PecaeUI/PecaeGlassCard';
import { useBrands, useModels, useBrandYears } from '../../hooks/useCatalog';

interface SearchFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { brandId?: string; modelId?: string; yearFabId?: string }) => void;
  initialFilters?: { brandId?: string; modelId?: string; yearFabId?: string };
}

export function SearchFilterModal({ visible, onClose, onApply, initialFilters }: SearchFilterModalProps) {
  const { colors, typography } = usePecaeTheme();
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(initialFilters?.brandId);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(initialFilters?.modelId);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(initialFilters?.yearFabId);

  const { data: brands, isLoading: loadingBrands } = useBrands();
  const { data: models, isLoading: loadingModels } = useModels(selectedBrand);
  const { data: years, isLoading: loadingYears } = useBrandYears(selectedBrand);

  useEffect(() => {
    if (visible && initialFilters) {
      setSelectedBrand(initialFilters.brandId);
      setSelectedModel(initialFilters.modelId);
      setSelectedYear(initialFilters.yearFabId);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApply({
      brandId: selectedBrand,
      modelId: selectedModel,
      yearFabId: selectedYear,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedBrand(undefined);
    setSelectedModel(undefined);
    setSelectedYear(undefined);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <PecaeGlassCard intensity={40} style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
              FILTROS AVANÇADOS
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* MARCA */}
            <Text style={[styles.label, { color: colors.textMuted, fontFamily: typography.medium }]}>MARCA</Text>
            <View style={styles.chipsContainer}>
              {loadingBrands ? (
                <ActivityIndicator color={colors.brand} />
              ) : (
                brands?.map((brand) => (
                  <TouchableOpacity
                    key={brand.id}
                    onPress={() => {
                      setSelectedBrand(brand.id);
                      setSelectedModel(undefined);
                      setSelectedYear(undefined);
                    }}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      selectedBrand === brand.id && { borderColor: colors.brand, backgroundColor: 'rgba(63, 255, 139, 0.1)' }
                    ]}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: colors.textPrimary, fontFamily: typography.body },
                      selectedBrand === brand.id && { color: colors.brand, fontFamily: typography.bold }
                    ]}>
                      {brand.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* MODELO */}
            {selectedBrand && (
              <>
                <Text style={[styles.label, { color: colors.textMuted, fontFamily: typography.medium, marginTop: 20 }]}>MODELO</Text>
                <View style={styles.chipsContainer}>
                  {loadingModels ? (
                    <ActivityIndicator color={colors.brand} />
                  ) : models?.length === 0 ? (
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>Nenhum modelo disponível</Text>
                  ) : (
                    models?.map((model) => (
                      <TouchableOpacity
                        key={model.id}
                        onPress={() => setSelectedModel(model.id)}
                        style={[
                          styles.chip,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          selectedModel === model.id && { borderColor: colors.brand, backgroundColor: 'rgba(63, 255, 139, 0.1)' }
                        ]}
                      >
                        <Text style={[
                          styles.chipText,
                          { color: colors.textPrimary, fontFamily: typography.body },
                          selectedModel === model.id && { color: colors.brand, fontFamily: typography.bold }
                        ]}>
                          {model.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </>
            )}

            {/* ANO */}
            {selectedBrand && (
              <>
                <Text style={[styles.label, { color: colors.textMuted, fontFamily: typography.medium, marginTop: 20 }]}>ANO FABRICAÇÃO</Text>
                <View style={styles.chipsContainer}>
                  {loadingYears ? (
                    <ActivityIndicator color={colors.brand} />
                  ) : (
                    years?.map((y) => (
                      <TouchableOpacity
                        key={y.id}
                        onPress={() => setSelectedYear(y.id)}
                        style={[
                          styles.chip,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          selectedYear === y.id && { borderColor: colors.brand, backgroundColor: 'rgba(63, 255, 139, 0.1)' }
                        ]}
                      >
                        <Text style={[
                          styles.chipText,
                          { color: colors.textPrimary, fontFamily: typography.body },
                          selectedYear === y.id && { color: colors.brand, fontFamily: typography.bold }
                        ]}>
                          {y.year}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </>
            )}
            
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Text style={[styles.clearBtnText, { color: colors.textMuted, fontFamily: typography.bold }]}>LIMPAR TUDO</Text>
            </TouchableOpacity>
            <PecaeButton 
              title="APLICAR FILTROS" 
              onPress={handleApply}
              style={{ flex: 1 }}
            />
          </View>
        </PecaeGlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    letterSpacing: 2,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  clearBtn: {
    paddingVertical: 12,
  },
  clearBtnText: {
    fontSize: 12,
    letterSpacing: 1,
  },
});
