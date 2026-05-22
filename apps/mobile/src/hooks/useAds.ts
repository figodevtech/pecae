import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsService } from '../services/ads';

export const useAllCampaigns = () => {
  return useQuery({
    queryKey: ['ads', 'campaigns'],
    queryFn: () => adsService.getAllCampaigns(),
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: any) =>
      adsService.createCampaign(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads', 'campaigns'] });
    },
  });
};

export const usePauseCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adsService.pauseCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads', 'campaigns'] });
    },
  });
};

export const useResumeCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adsService.resumeCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads', 'campaigns'] });
    },
  });
};

export const useCancelCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adsService.cancelCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads', 'campaigns'] });
    },
  });
};
