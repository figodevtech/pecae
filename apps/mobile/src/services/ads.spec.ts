import { adsService } from './ads';
import { api } from './api';

jest.mock('./api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('adsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockCampaign = {
    id: '123',
    listingId: 'listing-456',
    budget: 100,
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    status: 'ACTIVE',
    impressions: 10,
    clicks: 2,
    createdAt: '2023-01-01T00:00:00Z',
    listing: {
      title: 'Test Car',
      price: 10000,
    },
  };

  describe('getAllCampaigns', () => {
    it('should call api.get with correct url and return data', async () => {
      const mockData = [mockCampaign];
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

      const result = await adsService.getAllCampaigns();

      expect(api.get).toHaveBeenCalledWith('/ads/campaigns');
      expect(result).toEqual(mockData);
    });
  });

  describe('createCampaign', () => {
    it('should call api.post with correct url and payload, and return data', async () => {
      const dto = {
        listingId: 'listing-456',
        budget: 100,
        startDate: '2023-01-01',
      };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockCampaign });

      const result = await adsService.createCampaign(dto);

      expect(api.post).toHaveBeenCalledWith('/ads/campaigns', dto);
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('pauseCampaign', () => {
    it('should call api.patch with correct url and return data', async () => {
      const id = '123';
      (api.patch as jest.Mock).mockResolvedValueOnce({ data: mockCampaign });

      const result = await adsService.pauseCampaign(id);

      expect(api.patch).toHaveBeenCalledWith(`/ads/campaigns/${id}/pause`);
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('resumeCampaign', () => {
    it('should call api.patch with correct url and return data', async () => {
      const id = '123';
      (api.patch as jest.Mock).mockResolvedValueOnce({ data: mockCampaign });

      const result = await adsService.resumeCampaign(id);

      expect(api.patch).toHaveBeenCalledWith(`/ads/campaigns/${id}/resume`);
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('cancelCampaign', () => {
    it('should call api.patch with correct url and return data', async () => {
      const id = '123';
      (api.patch as jest.Mock).mockResolvedValueOnce({ data: mockCampaign });

      const result = await adsService.cancelCampaign(id);

      expect(api.patch).toHaveBeenCalledWith(`/ads/campaigns/${id}/cancel`);
      expect(result).toEqual(mockCampaign);
    });
  });
});
