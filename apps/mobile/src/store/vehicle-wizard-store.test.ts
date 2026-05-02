import { useVehicleWizardStore } from './vehicle-wizard-store';

describe('VehicleWizardStore', () => {
  beforeEach(() => {
    useVehicleWizardStore.getState().resetWizard();
  });

  it('[STORE-WIZ-01] VehicleWizardStore — seção de fotos sincroniza com estado global', () => {
    useVehicleWizardStore.getState().updateData({ photos: [{ uri: 'photo1.jpg', name: 'photo1.jpg', type: 'image/jpeg' }] });
    expect(useVehicleWizardStore.getState().data.photos[0].uri).toBe('photo1.jpg');
  });

  it('[STORE-WIZ-02] VehicleWizardStore — dados técnicos e fotos são independentes', () => {
    useVehicleWizardStore.getState().updateData({ photos: [{ uri: 'photo1.jpg', name: 'photo1.jpg', type: 'image/jpeg' }] });
    const photosBefore = useVehicleWizardStore.getState().data.photos;
    useVehicleWizardStore.getState().updateData({ brandId: 'Honda' });
    expect(useVehicleWizardStore.getState().data.brandId).toBe('Honda');
    expect(useVehicleWizardStore.getState().data.photos).toEqual(photosBefore);
  });

  it('[STORE-WIZ-03] VehicleWizardStore — resetWizard limpa todas as seções', () => {
    useVehicleWizardStore.getState().updateData({
      photos: [{ uri: 'photo1.jpg', name: 'photo1.jpg', type: 'image/jpeg' }],
      brandId: 'Fiat',
      availableParts: ['Engine']
    });
    useVehicleWizardStore.getState().resetWizard();
    expect(useVehicleWizardStore.getState().data.photos).toHaveLength(0);
    expect(useVehicleWizardStore.getState().data.brandId).toBeUndefined();
    expect(useVehicleWizardStore.getState().data.availableParts).toHaveLength(0);
  });
});
