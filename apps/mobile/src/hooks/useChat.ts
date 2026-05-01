import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface ChatRoom {
  id: string;
  listingId?: string;
  vehicleId?: string;
  buyerId: string;
  sellerId: string;
  listingTitle: string;
  listingThumbnail: string | null;
  interlocutor: {
    id: string;
    name: string;
    avatar: string | null;
  };
  lastInteraction?: string;
}

export function useChat() {
  const queryClient = useQueryClient();

  const createRoom = useMutation({
    mutationFn: async ({ listingId, vehicleId }: { listingId?: string, vehicleId?: string }) => {
      const response = await api.post<ChatRoom>('/chat/rooms', { listingId, vehicleId });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
    },
  });

  return {
    createRoom,
  };
}
