import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface VehiclePhoto {
  url: string;
  blurhash?: string | null;
  order?: number;
}

export interface VehicleListing {
  id: string;
  title?: string;
  brand: string;
  model: string;
  version: string;
  yearFab: number;
  color: string;
  city: string;
  state: string;
  status: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SOLD';
  createdAt: string;
  photos: VehiclePhoto[];
  availableParts: string[];
}

export interface VehicleDonor {
  id: string;
  brand: string;
  model: string;
  version: string;
  yearFab: number;
  color: string;
  city: string;
  state: string;
  thumbnail: string | null;
  photos: VehiclePhoto[];
  availablePartsCount: number;
  availableParts: string[];
  seller: {
    id: string;
    storeName: string;
    city: string;
    state: string;
    isVerified: boolean;
  };
  isSponsored: boolean;
  createdAt: string;
  observations?: string;
}

export const useVehicles = () => {
  return useQuery({
    queryKey: ['vehicles', 'me'],
    queryFn: async () => {
      const { data } = await api.get<VehicleListing[]>('/vehicles/me');
      return data;
    },
  });
};

export const useSearchVehicles = (filters?: { 
  brandId?: string; 
  modelId?: string; 
  versionId?: string; 
  yearMin?: number;
  yearMax?: number;
  q?: string;
  city?: string;
  state?: string;
}) => {
  return useQuery({
    queryKey: ['vehicles', 'search', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: VehicleDonor[], hasMore: boolean, nextCursor: string | null }>('/search', { params: filters });
      return data;
    },
  });
};

export interface SearchSuggestion {
  text: string;
  type: 'BRAND' | 'MODEL';
  id: string;
}

export const useSearchSuggestions = (q: string) => {
  return useQuery({
    queryKey: ['search', 'suggestions', q],
    queryFn: async () => {
      if (!q || q.trim().length < 2) return [];
      const { data } = await api.get<SearchSuggestion[]>('/search/suggestions', { params: { q } });
      return data;
    },
    enabled: q.trim().length >= 2,
  });
};

export const useVehicleDetails = (id: string) => {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: async () => {
      const { data } = await api.get<VehicleDonor>(`/vehicles/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useVehicleActions = () => {
  const queryClient = useQueryClient();

  const markAsSold = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/vehicles/${id}/status`, { status: 'SOLD' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const markAsRemoved = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/vehicles/${id}/status`, { status: 'INACTIVE' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/vehicles/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'me'] });
    },
  });

  return { markAsSold, markAsRemoved, deleteVehicle };
};
