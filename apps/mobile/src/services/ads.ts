import { api } from './api';

export interface AdCampaign {
  id: string;
  listingId: string;
  budget: number;
  startDate: string;
  endDate: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  impressions: number;
  clicks: number;
  createdAt: string;
  listing: {
    title: string;
    vehicle?: {
      brand?: { name: string };
      model?: { name: string };
      photos?: Array<{ url: string }>;
    };
  };
}

export const adsService = {
  async getAllCampaigns(): Promise<AdCampaign[]> {
    const response = await api.get('/ads/campaigns');
    return response.data;
  },

  async createCampaign(dto: any): Promise<AdCampaign> {
    const response = await api.post('/ads/campaigns', dto);
    return response.data;
  },

  async pauseCampaign(id: string): Promise<AdCampaign> {
    const response = await api.patch(`/ads/campaigns/${id}/pause`);
    return response.data;
  },

  async resumeCampaign(id: string): Promise<AdCampaign> {
    const response = await api.patch(`/ads/campaigns/${id}/resume`);
    return response.data;
  },

  async cancelCampaign(id: string): Promise<AdCampaign> {
    const response = await api.patch(`/ads/campaigns/${id}/cancel`);
    return response.data;
  },
};
