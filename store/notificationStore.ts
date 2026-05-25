import { create } from 'zustand';
import { Notification } from '../types';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from './authStore';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    set({ isLoading: true });
    const notifications = await notificationService.getNotifications(userId);
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount, isLoading: false });
  },

  markAsRead: async (id) => {
    await notificationService.markAsRead(id);
    const { notifications } = get();
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    const unreadCount = updated.filter((n) => !n.read).length;
    set({ notifications: updated, unreadCount });
  },

  markAllAsRead: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    await notificationService.markAllAsRead(userId);
    const { notifications } = get();
    const updated = notifications.map((n) => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
  },
}));
