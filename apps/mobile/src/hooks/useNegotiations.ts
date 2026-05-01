import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Negotiation {
  id: string;
  listing: {
    id: string;
    title: string;
    status: string;
    price: number | null;
    thumbnail: string | null;
    vehicleInfo: {
      brand: string;
      model: string;
      version: string;
    } | null;
  };
  seller: {
    id: string;
    storeName: string;
  };
  lastInteraction: string;
  lastMessage: string | null;
}

export function useNegotiations() {
  const query = useQuery({
    queryKey: ['negotiations'],
    queryFn: async () => {
      const response = await api.get<Negotiation[]>('/buyers/negotiations');
      return response.data;
    },
  });

  return query;
}
