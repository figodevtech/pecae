import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../theme';
import { PecaeGlassCard } from '../PecaeUI/PecaeGlassCard';
import { PecaeButton } from '../PecaeUI/PecaeButton';
import { PecaeInput } from '../PecaeUI/PecaeInput';
import { useVehicleWizardStore } from '../../store/vehicle-wizard-store';
import { usePartCategories } from '../../hooks/useCatalog';

export const Step4Inventory: React.FC = () => {
  const { colors, typography } = usePecaeTheme();
  const { data, updateData, nextStep, prevStep } = useVehicleWizardStore();
  const { data: categories, isLoading } = usePartCategories();

  const togglePart = (name: string) => {
    const newParts = data.availableParts.includes(name)
      ? data.availableParts.filter((p) => p !== name)
      : [...data.availableParts, name];
    updateData({ availableParts: newParts });
  };

  const isValid = !!(data.title && data.availableParts.length > 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PecaeInput
        label="Título do Anúncio"
        placeholder="Ex: Sucata do Fiat Uno 2015 - Peças"
        value={data.title}
        onChangeText={(text) => updateData({ title: text })}
      />

      <PecaeInput
        label="Descrição do Anúncio (Opcional)"
        placeholder="Descreva o estado das peças..."
        value={data.description}
        onChangeText={(text) => updateData({ description: text })}
        multiline
        numberOfLines={3}
      />

      <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: typography.heading }]}>
        Peças Disponíveis
      </Text>
      
      {isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ margin: 20 }} />
      ) : (
        <View style={styles.grid}>
          {categories?.map((cat) => {
            const isSelected = data.availableParts.includes(cat.name);
            return (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.partCardWrapper}
                onPress={() => togglePart(cat.name)}
              >
                <PecaeGlassCard 
                  intensity={isSelected ? 30 : 10} 
                  style={[
                    styles.partCard, 
                    isSelected && { borderColor: colors.brand, borderWidth: 1 }
                  ]}
                >
                  <Ionicons 
                    name={cat.icon as any || 'settings-outline'} 
                    size={24} 
                    color={isSelected ? colors.brand : colors.textMuted} 
                  />
                  <Text 
                    numberOfLines={1}
                    style={[
                      styles.partLabel, 
                      { 
                        color: isSelected ? colors.brand : colors.textMuted,
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

      <View style={styles.footer}>
        <PecaeButton
          title="Voltar"
          type="secondary"
          onPress={prevStep}
          style={styles.button}
        />
        <PecaeButton
          title="Revisar"
          onPress={nextStep}
          disabled={!isValid}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  partCardWrapper: {
    width: '31%',
    aspectRatio: 1,
    marginBottom: 10,
  },
  partCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  partLabel: {
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});
