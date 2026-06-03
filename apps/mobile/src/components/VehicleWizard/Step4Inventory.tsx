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

  const isValid = data.availableParts.length > 0 && !!data.title;


  const inventoryGroups = [
    {
      name: 'Motor & Câmbio',
      slugs: ['motor', 'cambio', 'arrefecimento', 'ar-condicionado', 'escapamento'],
      icon: 'settings-outline' as const
    },
    {
      name: 'Suspensão & Eixos',
      slugs: ['suspensao-dianteira', 'suspensao-traseira', 'freios', 'rodas-pneus', 'direcao'],
      icon: 'construct-outline' as const
    },
    {
      name: 'Carroceria & Cabine',
      slugs: ['lataria', 'vidros', 'bancos-estofamento', 'painel-eletrica', 'capo-para-choque'],
      icon: 'car-outline' as const
    }
  ];

  const content = (
    <View style={!isInline && styles.container}>
      {!isInline && (
        <>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
            Inventário Técnico
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
            Selecione os componentes disponíveis para comercialização imediata.
          </Text>
        </>
      )}

      <View style={styles.bulkActions}>
        <TouchableOpacity onPress={selectAll}>
          <Text style={[styles.actionText, { color: colors.brand, fontFamily: typography.bold }]}>
            MARCAR TODOS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={deselectAll}>
          <Text style={[styles.actionText, { color: colors.textMuted, fontFamily: typography.bold }]}>
            LIMPAR SELEÇÃO
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ margin: 40 }} />
      ) : (
        <View>
          {inventoryGroups.map((group) => {
            const groupParts = categories?.filter(cat => group.slugs.includes(cat.slug)) || [];
            if (groupParts.length === 0) return null;

            return (
              <View key={group.name} style={styles.groupContainer}>
                <View style={styles.groupHeader}>
                  <Ionicons name={group.icon} size={16} color={colors.brand} />
                  <Text style={[styles.groupTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
                    {group.name.toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.grid}>
                  {groupParts.map((cat) => {
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
                            isSelected && { borderColor: colors.brand, borderWidth: 1 }
                          ]}
                        >
                          <View style={styles.partHeader}>
                            <Ionicons 
                              name={isSelected ? 'checkbox' : 'square-outline'} 
                              size={16} 
                              color={isSelected ? colors.brand : colors.textMuted} 
                            />
                            {isSelected && (
                              <View style={[styles.activeIndicator, { backgroundColor: colors.brand }]} />
                            )}
                          </View>
                          <Text 
                            numberOfLines={1}
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
              </View>
            );
          })}
        </View>
      )}

      {!isInline && (
        <>
          <View style={styles.observationsContainer}>
            <PecaeInput
              label="Título do Anúncio"
              placeholder="Ex: Sucata Uno Vivace 2015 Inteira"
              value={data.title || ''}
              onChangeText={(text) => updateData({ title: text })}
            />
            
            <PecaeInput
              label="Descrição do Anúncio"
              placeholder="Descreva o estado geral para o comprador..."
              value={data.description || ''}
              onChangeText={(text) => updateData({ description: text })}
              multiline
              numberOfLines={3}
            />

            <PecaeInput
              label="Observações Técnicas (Interno)"
              placeholder="Ex: Motor ok, batida lateral esquerda..."
              value={data.observations || ''}
              onChangeText={(text) => updateData({ observations: text })}
              multiline
              numberOfLines={3}
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
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  groupTitle: {
    fontSize: 14,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  partCardWrapper: {
    width: '48.5%',
    height: 70,
    marginBottom: 10,
  },
  partCard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  partLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  observationsContainer: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  scrollContainer: {
    padding: 0,
  },
});
