import { api } from './api';

export type NotificationType = 'PAYMENT_OVERDUE' | 'ENROLLMENT_PENDING' | 'SYSTEM' | 'CUSTOM';
export type NotificationChannel = 'SYSTEM' | 'EMAIL' | 'WHATSAPP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  studentId?: string | null;
  status: NotificationStatus;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const notificationsService = {
  async findAll(userId?: string): Promise<AppNotification[]> {
    try {
      const params = userId ? `?userId=${userId}` : '';
      const response = await api.get<AppNotification[]>(`/notifications${params}`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && typeof response.data === 'object') {
        const anyData = response.data as any;
        if (Array.isArray(anyData.notifications)) return anyData.notifications;
        if (Array.isArray(anyData.data)) return anyData.data;
      }
      return [];
    } catch (err) {
      console.warn('Erro ao carregar notificações:', err);
      return [];
    }
  },

  async findUnread(userId: string): Promise<AppNotification[]> {
    try {
      const response = await api.get<AppNotification[]>(`/notifications/unread/${userId}`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && typeof response.data === 'object') {
        const anyData = response.data as any;
        if (Array.isArray(anyData.notifications)) return anyData.notifications;
        if (Array.isArray(anyData.data)) return anyData.data;
      }
      return [];
    } catch (err) {
      console.warn('Erro ao carregar notificações não lidas:', err);
      return [];
    }
  },

  async markAsRead(id: string): Promise<AppNotification> {
    const response = await api.patch<AppNotification>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const response = await api.patch<{ count: number }>(`/notifications/read-all/${userId}`);
    return response.data;
  },
};
