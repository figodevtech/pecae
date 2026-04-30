import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface VehicleListing {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  photos: Array<{ url: string }>;
  listing?: {
    id: string;
    status: string;
  };
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

export const useListings = (filters?: { city?: string; state?: string }) => {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      let apiData: any[] = [];
      try {
        const { data } = await api.get('/listings', { params: filters });
        apiData = data || [];
      } catch (e) {
        console.warn('API fetch failed, falling back to mocks only.');
      }

      const mockVehicles: any[] = [
        {
          id: 'mock-1',
          city: 'Belo Horizonte',
          state: 'MG',
          color: 'Preto',
          plate: 'GVK-1284',
          photos: [{ url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-1',
            status: 'PUBLISHED',
            title: 'Chevrolet Onix - Motor 1.0 Integro',
            brand: 'Chevrolet',
            model: 'Onix',
            views: 242
          }
        },
        {
          id: 'mock-2',
          city: 'Curitiba',
          state: 'PR',
          color: 'Branco',
          plate: 'PXW-4512',
          photos: [{ url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-2',
            status: 'PUBLISHED',
            title: 'Ford Ka - Sucata Inteira',
            brand: 'Ford',
            model: 'Ka',
            views: 189
          }
        },
        {
          id: 'mock-3',
          city: 'Rio de Janeiro',
          state: 'RJ',
          color: 'Vermelho',
          plate: 'KRA-9081',
          photos: [{ url: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-3',
            status: 'PUBLISHED',
            title: 'Volkswagen Gol - Ótimas Peças',
            brand: 'Volkswagen',
            model: 'Gol',
            views: 312
          }
        },
        {
          id: 'mock-4',
          city: 'São Paulo',
          state: 'SP',
          color: 'Prata',
          plate: 'DRE-1223',
          photos: [{ url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-4',
            status: 'PUBLISHED',
            title: 'Toyota Corolla - Peças de Suspensão',
            brand: 'Toyota',
            model: 'Corolla',
            views: 450
          }
        },
        {
          id: 'mock-5',
          city: 'Porto Alegre',
          state: 'RS',
          color: 'Azul',
          plate: 'ITL-8822',
          photos: [{ url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-5',
            status: 'PUBLISHED',
            title: 'Hyundai HB20 - Sucata Completa',
            brand: 'Hyundai',
            model: 'HB20',
            views: 198
          }
        },
        {
          id: 'mock-6',
          city: 'Goiânia',
          state: 'GO',
          color: 'Preto',
          plate: 'OGV-7712',
          photos: [{ url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-6',
            status: 'PUBLISHED',
            title: 'Fiat Strada - Caixa e Motor',
            brand: 'Fiat',
            model: 'Strada',
            views: 388
          }
        },
        {
          id: 'mock-7',
          city: 'Salvador',
          state: 'BA',
          color: 'Branco',
          plate: 'PQA-1190',
          photos: [{ url: 'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-7',
            status: 'PUBLISHED',
            title: 'Jeep Renegade - Apenas Peças',
            brand: 'Jeep',
            model: 'Renegade',
            views: 260
          }
        },
        {
          id: 'mock-8',
          city: 'Fortaleza',
          state: 'CE',
          color: 'Prata',
          plate: 'NUE-8172',
          photos: [{ url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-8',
            status: 'PUBLISHED',
            title: 'Renault Sandero - Bom Estado',
            brand: 'Renault',
            model: 'Sandero',
            views: 145
          }
        },
        {
          id: 'mock-9',
          city: 'Recife',
          state: 'PE',
          color: 'Preto',
          plate: 'KLO-2253',
          photos: [{ url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-9',
            status: 'PUBLISHED',
            title: 'Honda Civic - Bancos e Lataria',
            brand: 'Honda',
            model: 'Civic',
            views: 520
          }
        },
        {
          id: 'mock-10',
          city: 'Manaus',
          state: 'AM',
          color: 'Vermelho',
          plate: 'JXA-5621',
          photos: [{ url: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-10',
            status: 'PUBLISHED',
            title: 'Nissan Kicks - Peças de Elétrica',
            brand: 'Nissan',
            model: 'Kicks',
            views: 290
          }
        },
        {
          id: 'mock-11',
          city: 'Florianópolis',
          state: 'SC',
          color: 'Azul',
          plate: 'MKD-9981',
          photos: [{ url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-11',
            status: 'PUBLISHED',
            title: 'Volkswagen Polo - Lataria Perfeita',
            brand: 'Volkswagen',
            model: 'Polo',
            views: 221
          }
        },
        {
          id: 'mock-12',
          city: 'Cuiabá',
          state: 'MT',
          color: 'Prata',
          plate: 'NJG-3412',
          photos: [{ url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-12',
            status: 'PUBLISHED',
            title: 'Toyota Hilux - Peças do Motor',
            brand: 'Toyota',
            model: 'Hilux',
            views: 410
          }
        },
        {
          id: 'mock-13',
          city: 'Belém',
          state: 'PA',
          color: 'Branco',
          plate: 'QDA-1144',
          photos: [{ url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-13',
            status: 'PUBLISHED',
            title: 'Chevrolet Tracker - Peças Internas',
            brand: 'Chevrolet',
            model: 'Tracker',
            views: 175
          }
        },
        {
          id: 'mock-14',
          city: 'Vitória',
          state: 'ES',
          color: 'Preto',
          plate: 'PPE-5612',
          photos: [{ url: 'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-14',
            status: 'PUBLISHED',
            title: 'Fiat Toro - Suspensão Traseira',
            brand: 'Fiat',
            model: 'Toro',
            views: 305
          }
        },
        {
          id: 'mock-15',
          city: 'Campo Grande',
          state: 'MS',
          color: 'Vermelho',
          plate: 'HSG-4512',
          photos: [{ url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80' }],
          listing: {
            id: 'mock-listing-15',
            status: 'PUBLISHED',
            title: 'Hyundai HB20S - Motor e Câmbio',
            brand: 'Hyundai',
            model: 'HB20S',
            views: 195
          }
        }
      ];

      return [...apiData, ...mockVehicles];
    },
  });
};

export const useVehicleActions = () => {
  const queryClient = useQueryClient();

  const markAsSold = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/vehicles/${id}/sold`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'me'] });
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/listings/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'me'] });
    },
  });

  return { markAsSold, deleteVehicle };
};
