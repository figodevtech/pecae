import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moderationService } from '../services/moderation';

export const useModerationListings = (filters?: { sellerId?: string; status?: string; startDate?: string; endDate?: string; cursor?: string }) => {
  return useQuery({
    queryKey: ['moderation', 'listings', filters],
    queryFn: () => moderationService.getListings(filters),
  });
};

export const useModerationVerifications = () => {
  return useQuery({
    queryKey: ['moderation', 'verifications'],
    queryFn: () => moderationService.getVerifications(),
  });
};

export const useApproveListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => moderationService.approveListing(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'listings'] });
    },
  });
};

export const useRejectListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => moderationService.rejectListing(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'listings'] });
    },
  });
};

export const useApproveVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => moderationService.approveVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'verifications'] });
    },
  });
};

export const useRejectVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => moderationService.rejectVerification(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'verifications'] });
    },
  });
};
