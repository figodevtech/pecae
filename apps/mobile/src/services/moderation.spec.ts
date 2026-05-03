import { moderationService } from './moderation';
import { api } from './api';

// Mock the api module
jest.mock('./api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('moderationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getListings', () => {
    it('should call api.get with correct path and without params if filters are not provided', async () => {
      const mockResponse = { data: { items: [], hasMore: false, nextCursor: null } };
      (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await moderationService.getListings();

      expect(api.get).toHaveBeenCalledWith('/moderation/listings', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should call api.get with correct path and params if filters are provided', async () => {
      const mockResponse = { data: { items: [], hasMore: false, nextCursor: null } };
      (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);
      const filters = { status: 'pending', sellerId: '123' };

      const result = await moderationService.getListings(filters);

      expect(api.get).toHaveBeenCalledWith('/moderation/listings', { params: filters });
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate errors from api.get', async () => {
      const mockError = new Error('Network Error');
      (api.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(moderationService.getListings()).rejects.toThrow('Network Error');
    });
  });

  describe('approveListing', () => {
    it('should call api.post with correct path and body including moderatorNote', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await moderationService.approveListing('1', 'Looks good');

      expect(api.post).toHaveBeenCalledWith('/moderation/listings/1/approve', { moderatorNote: 'Looks good' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should call api.post with correct path and body without moderatorNote if not provided', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await moderationService.approveListing('1');

      expect(api.post).toHaveBeenCalledWith('/moderation/listings/1/approve', { moderatorNote: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate errors from api.post', async () => {
      const mockError = new Error('Network Error');
      (api.post as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(moderationService.approveListing('1')).rejects.toThrow('Network Error');
    });
  });

  describe('rejectListing', () => {
    it('should call api.post with correct path and rejection reason', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await moderationService.rejectListing('1', 'Inappropriate content');

      expect(api.post).toHaveBeenCalledWith('/moderation/listings/1/reject', { rejectionReason: 'Inappropriate content' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate errors from api.post', async () => {
      const mockError = new Error('Network Error');
      (api.post as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(moderationService.rejectListing('1', 'reason')).rejects.toThrow('Network Error');
    });
  });

  describe('getVerifications', () => {
    it('should call api.get with correct path', async () => {
      const mockResponse = { data: [] };
      (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await moderationService.getVerifications();

      expect(api.get).toHaveBeenCalledWith('/moderation/verifications');
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate errors from api.get', async () => {
      const mockError = new Error('Network Error');
      (api.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(moderationService.getVerifications()).rejects.toThrow('Network Error');
    });
  });

  describe('approveVerification', () => {
    it('should call api.post with correct path', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await moderationService.approveVerification('1');

      expect(api.post).toHaveBeenCalledWith('/moderation/verifications/1/approve');
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate errors from api.post', async () => {
      const mockError = new Error('Network Error');
      (api.post as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(moderationService.approveVerification('1')).rejects.toThrow('Network Error');
    });
  });

  describe('rejectVerification', () => {
    it('should call api.post with correct path and rejection reason', async () => {
      const mockResponse = { data: { success: true } };
      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await moderationService.rejectVerification('1', 'Invalid document');

      expect(api.post).toHaveBeenCalledWith('/moderation/verifications/1/reject', { rejectionReason: 'Invalid document' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate errors from api.post', async () => {
      const mockError = new Error('Network Error');
      (api.post as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(moderationService.rejectVerification('1', 'reason')).rejects.toThrow('Network Error');
    });
  });
});
