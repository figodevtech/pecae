import { api } from './api';

export interface ListingPhoto {
  id: string;
  url: string;
  order: number;
}

export interface PendingListing {
  id: string;
  title: string;
  createdAt: string;
  vehicle: {
    brand: { name: string };
    model: { name: string };
    version: { name: string };
    yearFab: string;
    licensePlate: string;
    photos: ListingPhoto[];
  };
  sellerProfile: {
    id: string;
    name: string;
    isVerified: boolean;
    totalListings: number;
    user: {
      name: string;
      email: string;
    }
  };
}

export interface PendingVerification {
  id: string;
  sellerId: string;
  documentUrls: string[];
  signedUrls: string[];
  createdAt: string;
  status: string;
  sellerProfile: {
    user: {
      name: string;
      email: string;
    }
  }
}

export const moderationService = {
  async getListings(filters?: { sellerId?: string; status?: string; startDate?: string; endDate?: string; cursor?: string }) {
    const response = await api.get('/moderation/listings', { params: filters });
    return response.data as { items: PendingListing[]; hasMore: boolean; nextCursor: string | null };
  },

  async approveListing(id: string, moderatorNote?: string) {
    const response = await api.post(`/moderation/listings/${id}/approve`, { moderatorNote });
    return response.data;
  },

  async rejectListing(id: string, rejectionReason: string) {
    const response = await api.post(`/moderation/listings/${id}/reject`, { rejectionReason });
    return response.data;
  },

  async getVerifications() {
    const response = await api.get('/moderation/verifications');
    return response.data as PendingVerification[];
  },

  async approveVerification(id: string) {
    const response = await api.post(`/moderation/verifications/${id}/approve`);
    return response.data;
  },

  async rejectVerification(id: string, reason: string) {
    const response = await api.post(`/moderation/verifications/${id}/reject`, { rejectionReason: reason });
    return response.data;
  },
};
