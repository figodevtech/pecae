import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface VehicleBrand {
  id: string;
  name: string;
  country?: string;
  logoUrl?: string;
}

export interface VehicleModel {
  id: string;
  name: string;
  brandId: string;
  segment?: string;
}

export interface VehicleVersion {
  id: string;
  name: string;
  modelId: string;
  engineSize?: string;
  fuelType?: string;
}

export interface VehicleYear {
  id: string;
  year: number;
  modelYear: number;
  versionId: string;
}

export interface PartCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

const STALE_TIME = 1000 * 60 * 60; // 1 hour (catalog data is stable)

export const useBrands = () => {
  return useQuery({
    queryKey: ['catalog', 'brands'],
    queryFn: async () => {
      const { data } = await api.get<VehicleBrand[]>('/catalog/brands');
      return data;
    },
    staleTime: STALE_TIME,
  });
};

export const useModels = (brandId?: string) => {
  return useQuery({
    queryKey: ['catalog', 'brand', brandId, 'models'],
    queryFn: async () => {
      if (!brandId) return [];
      const { data } = await api.get<VehicleModel[]>(`/catalog/brands/${brandId}/models`);
      return data;
    },
    enabled: !!brandId,
    staleTime: STALE_TIME,
  });
};

export const useVersions = (modelId?: string) => {
  return useQuery({
    queryKey: ['catalog', 'model', modelId, 'versions'],
    queryFn: async () => {
      if (!modelId) return [];
      const { data } = await api.get<VehicleVersion[]>(`/catalog/models/${modelId}/versions`);
      return data;
    },
    enabled: !!modelId,
    staleTime: STALE_TIME,
  });
};

export const useYears = (versionId?: string) => {
  return useQuery({
    queryKey: ['catalog', 'version', versionId, 'years'],
    queryFn: async () => {
      if (!versionId) return [];
      const { data } = await api.get<VehicleYear[]>(`/catalog/versions/${versionId}/years`);
      return data;
    },
    enabled: !!versionId,
    staleTime: STALE_TIME,
  });
};

export const usePartCategories = () => {
  return useQuery({
    queryKey: ['catalog', 'part-categories'],
    queryFn: async () => {
      const { data } = await api.get<PartCategory[]>('/catalog/part-categories');
      return data;
    },
    staleTime: STALE_TIME,
  });
};

export const useBrandYears = (brandId?: string) => {
  return useQuery({
    queryKey: ['catalog', 'brand', brandId, 'years'],
    queryFn: async () => {
      if (!brandId) return [];
      const { data } = await api.get<any[]>(`/catalog/brands/${brandId}/years`);
      return data;
    },
    enabled: !!brandId,
    staleTime: STALE_TIME,
  });
};

export const useModelsByYear = (brandId?: string, yearFab?: number, yearModel?: number) => {
  return useQuery({
    queryKey: ['catalog', 'brand', brandId, 'yearFab', yearFab, 'yearModel', yearModel, 'models'],
    queryFn: async () => {
      if (!brandId || yearFab === undefined || yearModel === undefined) return [];
      const { data } = await api.get<any[]>(`/catalog/brands/${brandId}/years/${yearFab}/${yearModel}/models`);
      return data;
    },
    enabled: !!brandId && yearFab !== undefined && yearModel !== undefined,
    staleTime: STALE_TIME,
  });
};

