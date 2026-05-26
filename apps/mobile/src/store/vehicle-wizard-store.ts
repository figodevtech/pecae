import { create } from 'zustand';

interface WizardData {
  // Step 1: Vehicle selection
  brandId?: string;
  modelId?: string;
  versionId?: string;
  yearFabId?: string;

  // Campos customizados para preenchimento manual
  customBrandName?: string;
  customModelName?: string;
  customVersionName?: string;
  customYearFab?: number;
  customYearModel?: number;

  // Step 2: Tech details
  color?: string;
  plate?: string;
  observations?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;

  // Step 3: Photos
  photos: Array<{ uri: string; type: string; name: string }>;
  coverPhotoUri?: string;

  // Step 4: Inventory
  title?: string;
  description?: string;
  availableParts: string[];
  editingId?: string;
}

interface WizardState {
  currentStep: number;
  data: WizardData;
  
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partialData: Partial<WizardData>) => void;
  resetWizard: () => void;
  loadVehicle: (vehicle: any) => void;
  isStepValid: (step: number) => boolean;
}

const initialData: WizardData = {
  photos: [],
  availableParts: [],
};

export const useVehicleWizardStore = create<WizardState>((set, get) => ({
  currentStep: 1,
  data: initialData,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),

  updateData: (partialData) => 
    set((state) => ({ 
      data: { ...state.data, ...partialData } 
    })),

  loadVehicle: (vehicle) => {
    const mainPhoto = vehicle.photos?.find((p: any) => p.order === 0);
    set({
      data: {
        brandId: vehicle.version?.model?.brandId,
        modelId: vehicle.version?.modelId,
        versionId: vehicle.versionId,
        yearFabId: vehicle.yearFabId,
        color: vehicle.color,
        plate: vehicle.plate,
        city: vehicle.city,
        state: vehicle.state,
        observations: vehicle.observations,
        lat: vehicle.lat,
        lng: vehicle.lng,
        title: vehicle.listings?.[0]?.title,
        description: vehicle.listings?.[0]?.description,
        availableParts: vehicle.availableParts || [],
        editingId: vehicle.id,
        coverPhotoUri: mainPhoto?.url,
        photos: vehicle.photos?.map((p: any) => ({
          uri: p.url,
          type: 'image/jpeg',
          name: p.url.split('/').pop(),
        })) || [],
      },
      currentStep: 1,
    });
  },

  resetWizard: () => set({ currentStep: 1, data: initialData }),

  isStepValid: (step) => {
    const { data } = get();
    switch (step) {
      case 1:
        return !!(
          (data.versionId || data.customVersionName) &&
          (data.yearFabId || (data.customYearFab && data.customYearModel))
        );
      case 2:
        return !!(data.color && data.city && data.state);
      case 3:
        // RN: Mínimo 4 fotos, Máximo 10.
        return data.photos.length >= 4 && data.photos.length <= 10;
      case 4:
        return !!(data.title && data.title.length >= 5 && data.availableParts.length > 0);
      default:
        return true;
    }
  },
}));
