import { api } from './api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  async getUserNotifications(limit = 20, cursor?: string) {
    const response = await api.get('/notifications', {
      params: { limit, cursor },
    });
    return response.data as { items: Notification[]; hasNextPage: boolean; nextCursor: string | null };
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data as { count: number };
  },

  async markAsRead(id: string) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};
