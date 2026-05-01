import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../theme';
import { PecaeGlassCard } from '../PecaeUI/PecaeGlassCard';
import { PecaeButton } from '../PecaeUI/PecaeButton';
import { PecaeInput } from '../PecaeUI/PecaeInput';
import { useVehicleWizardStore } from '../../store/vehicle-wizard-store';
import { usePartCategories } from '../../hooks/useCatalog';

interface Step4InventoryProps {
  isInline?: boolean;
}

export const Step4Inventory: React.FC<Step4InventoryProps> = ({ isInline }) => {
  const { colors, typography } = usePecaeTheme();
  const { data, updateData, nextStep, prevStep } = useVehicleWizardStore();
  const { data: categories, isLoading } = usePartCategories();

  const togglePart = (id: string) => {
    const newParts = data.availableParts.includes(id)
      ? data.availableParts.filter((p) => p !== id)
      : [...data.availableParts, id];
    updateData({ availableParts: newParts });
  };

  const selectAll = () => {
    if (categories) {
      updateData({ availableParts: categories.map(c => c.id) });
    }
  };

  const deselectAll = () => {
    updateData({ availableParts: [] });
  };

  const isValid = data.availableParts.length > 0;

  const content = (
    <View style={!isInline && styles.container}>
      {!isInline && (
        <>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
            Inventário de Peças
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
            Marque as peças que estão em bom estado para venda neste veículo.
          </Text>
        </>
      )}

      <View style={styles.bulkActions}>
        <TouchableOpacity onPress={selectAll}>
          <Text style={[styles.actionText, { color: colors.brand, fontFamily: typography.bold }]}>
            Selecionar Tudo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={deselectAll}>
          <Text style={[styles.actionText, { color: colors.textMuted, fontFamily: typography.bold }]}>
            Limpar Tudo
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ margin: 40 }} />
      ) : (
        <View style={styles.grid}>
          {categories?.map((cat) => {
            const isSelected = data.availableParts.includes(cat.id);
            return (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.partCardWrapper}
                onPress={() => togglePart(cat.id)}
                activeOpacity={0.7}
              >
                <PecaeGlassCard 
                  intensity={isSelected ? 35 : 15} 
                  style={[
                    styles.partCard, 
                    isSelected && { borderColor: colors.brand, borderWidth: 1.5 }
                  ]}
                >
                  <View style={styles.partHeader}>
                    <Ionicons 
                      name={cat.icon as any || 'settings-outline'} 
                      size={20} 
                      color={isSelected ? colors.brand : colors.textMuted} 
                    />
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color={colors.brand} />
                    )}
                  </View>
                  <Text 
                    numberOfLines={2}
                    style={[
                      styles.partLabel, 
                      { 
                        color: isSelected ? colors.textPrimary : colors.textMuted,
                        fontFamily: isSelected ? typography.bold : typography.body 
                      }
                    ]}
                  >
                    {cat.name}
                  </Text>
                </PecaeGlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!isInline && (
        <>
          <View style={styles.observationsContainer}>
            <PecaeInput
              label="Observações do Carro Doador"
              placeholder="Ex: Motor ok, batida lateral esquerda, interior em couro impecável..."
              value={data.observations || ''}
              onChangeText={(text) => updateData({ observations: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.footer}>
            <PecaeButton
              title="Voltar"
              type="secondary"
              onPress={prevStep}
              style={styles.button}
            />
            <PecaeButton
              title="Revisar Cadastro"
              onPress={nextStep}
              disabled={!isValid}
              style={styles.button}
            />
          </View>
        </>
      )}
    </View>
  );

  if (isInline) return content;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {content}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  actionText: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  partCardWrapper: {
    width: '48%',
    height: 90,
    marginBottom: 12,
  },
  partCard: {
    flex: 1,
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  observationsContainer: {
    marginTop: 20,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  scrollContainer: {
    padding: 0,
  },
});
