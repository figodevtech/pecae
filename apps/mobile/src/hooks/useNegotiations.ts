import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Negotiation {
  id: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    version: string;
    thumbnail: string | null;
    status: string;
  } | null;
  listing?: {
    id: string;
    title: string;
    status: string;
    price: number | null;
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
