import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { PecaeInput } from '../PecaeUI/PecaeInput';
import { PecaeButton } from '../PecaeUI/PecaeButton';
import { useVehicleWizardStore } from '../../store/vehicle-wizard-store';
import { usePecaeTheme } from '../../theme';

export const Step2TechDetails: React.FC = () => {
  const { colors } = usePecaeTheme();
  const { data, updateData, nextStep, prevStep } = useVehicleWizardStore();

  const isValid = !!(data.color && data.city && data.state);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PecaeInput
        label="Cor"
        placeholder="Ex: Prata"
        value={data.color}
        onChangeText={(text) => updateData({ color: text })}
      />



      <View style={styles.row}>
        <View style={{ flex: 3, marginRight: 10 }}>
          <PecaeInput
            label="Cidade"
            placeholder="Ex: São Paulo"
            value={data.city}
            onChangeText={(text) => updateData({ city: text })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PecaeInput
            label="UF"
            placeholder="SP"
            value={data.state}
            onChangeText={(text) => updateData({ state: text.toUpperCase() })}
            maxLength={2}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <PecaeInput
        label="Observações Técnicas"
        placeholder="Detalhes sobre a batida, estado do motor, etc."
        value={data.observations}
        onChangeText={(text) => updateData({ observations: text })}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <View style={styles.footer}>
        <PecaeButton
          title="Voltar"
          type="secondary"
          onPress={prevStep}
          style={styles.button}
        />
        <PecaeButton
          title="Próximo"
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
  row: {
    flexDirection: 'row',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});
