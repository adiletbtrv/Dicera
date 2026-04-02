import { create } from 'zustand';
import { api } from '@/lib/api.js';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<Notification[]>('/notifications');
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.is_read).length,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      const nextList = get().notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      set({
        notifications: nextList,
        unreadCount: nextList.filter((n) => !n.is_read).length,
      });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/read-all', {});
      const nextList = get().notifications.map((n) => ({ ...n, is_read: true }));
      set({ notifications: nextList, unreadCount: 0 });
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  },
}));
