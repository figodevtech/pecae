import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useVehicles } from './useVehicles';

export interface SellerStats {
  activeListings: number;
  totalListings: number;
  totalSold: number;
  avgResponseTimeMinutes: number | null;
  rating: number | null;
  totalReviews: number;
  totalChatsInitiated: number;
}

export interface RecentMessage {
  id: string;
  senderName: string;
  subject: string;
  lastText: string;
  time: string;
  avatar: string | null;
}

export function useSellerDashboard() {
  const { data: vehicles } = useVehicles();

  // Consome dados reais de GET /sellers/me/stats — sem mocks hardcoded
  const statsQuery = useQuery({
    queryKey: ['seller-stats'],
    queryFn: async (): Promise<SellerStats> => {
      const { data } = await api.get<SellerStats>('/sellers/me/stats');
      return data;
    },
  });

  const recentMessagesQuery = useQuery({
    queryKey: ['seller-recent-messages'],
    queryFn: async (): Promise<RecentMessage[]> => {
      // TODO M08: substituir por GET /chat/rooms quando M08 estiver integrado
      return [];
    },
  });

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    vehicles,
    recentMessages: recentMessagesQuery.data ?? [],
    isLoadingMessages: recentMessagesQuery.isLoading,
    refresh: () => {
      statsQuery.refetch();
      recentMessagesQuery.refetch();
    },
  };
}
