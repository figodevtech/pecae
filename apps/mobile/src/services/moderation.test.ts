import { moderationService } from './moderation';
import { api } from './api';

jest.mock('./api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('moderationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getListings', () => {
    it('should call api.get with correct url and params', async () => {
      const filters = { status: 'PENDING' };
      const mockResponse = { data: { items: [], hasMore: false, nextCursor: null } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await moderationService.getListings(filters);

      expect(api.get).toHaveBeenCalledWith('/moderation/listings', { params: filters });
      expect(result).toEqual(mockResponse.data);
    });

    it('should call api.get without params if not provided', async () => {
      const mockResponse = { data: { items: [], hasMore: false, nextCursor: null } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await moderationService.getListings();

      expect(api.get).toHaveBeenCalledWith('/moderation/listings', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('approveListing', () => {
    it('should call api.post with correct url and payload', async () => {
      const id = 'listing-123';
      const moderatorNote = 'Looks good';
      const mockResponse = { data: { success: true } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await moderationService.approveListing(id, moderatorNote);

      expect(api.post).toHaveBeenCalledWith(`/moderation/listings/${id}/approve`, { moderatorNote });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle call without moderatorNote', async () => {
      const id = 'listing-123';
      const mockResponse = { data: { success: true } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await moderationService.approveListing(id);

      expect(api.post).toHaveBeenCalledWith(`/moderation/listings/${id}/approve`, { moderatorNote: undefined });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('rejectListing', () => {
    it('should call api.post with correct url and reason', async () => {
      const id = 'listing-123';
      const rejectionReason = 'Inappropriate content';
      const mockResponse = { data: { success: true } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await moderationService.rejectListing(id, rejectionReason);

      expect(api.post).toHaveBeenCalledWith(`/moderation/listings/${id}/reject`, { rejectionReason });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getVerifications', () => {
    it('should call api.get with correct url', async () => {
      const mockResponse = { data: [] };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await moderationService.getVerifications();

      expect(api.get).toHaveBeenCalledWith('/moderation/verifications');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('approveVerification', () => {
    it('should call api.post with correct url', async () => {
      const id = 'verification-123';
      const mockResponse = { data: { success: true } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await moderationService.approveVerification(id);

      expect(api.post).toHaveBeenCalledWith(`/moderation/verifications/${id}/approve`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('rejectVerification', () => {
    it('should call api.post with correct url and reason', async () => {
      const id = 'verification-123';
      const reason = 'Blurry document';
      const mockResponse = { data: { success: true } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await moderationService.rejectVerification(id, reason);

      expect(api.post).toHaveBeenCalledWith(`/moderation/verifications/${id}/reject`, { rejectionReason: reason });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
