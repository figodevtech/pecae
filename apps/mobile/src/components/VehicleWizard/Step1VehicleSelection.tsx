import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VehicleSelector } from '../Catalog/VehicleSelector';
import { useVehicleWizardStore } from '../../store/vehicle-wizard-store';

export const Step1VehicleSelection: React.FC = () => {
  const { updateData, nextStep } = useVehicleWizardStore();

  const handleSelect = (selection: any) => {
    const isCustomVersion = selection.version.id === 'custom';
    const isCustomYear = selection.year.id === 'custom';

    updateData({
      // Seletor padrão de catálogo
      brandId: selection.brand.id === 'custom' ? undefined : selection.brand.id,
      modelId: selection.model.id === 'custom' ? undefined : selection.model.id,
      versionId: isCustomVersion ? undefined : selection.version.id,
      yearFabId: isCustomYear ? undefined : selection.year.id,

      // Valores customizados se o preenchimento for livre
      customBrandName: isCustomVersion ? selection.brand.name : undefined,
      customModelName: isCustomVersion ? selection.model.name : undefined,
      customVersionName: isCustomVersion ? selection.version.name : undefined,
      customYearFab: isCustomYear ? selection.year.yearFab : undefined,
      customYearModel: isCustomYear ? selection.year.yearModel : undefined,
    });
    nextStep();
  };

  return (
    <View style={styles.container}>
      <VehicleSelector onSelect={handleSelect} requireCompleteSelection={true} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
