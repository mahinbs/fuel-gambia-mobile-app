import { notificationFunctions } from '../supabase';
import { Notification } from '../types';

export const notificationService = {
  /** Get notifications for user */
  async getNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    try {
      const data = await notificationFunctions.getNotifications(userId, unreadOnly);
      return (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        type: item.type as any,
        title: item.title,
        message: item.message,
        data: item.data,
        read: item.is_read,
        createdAt: item.created_at,
      })) as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  /** Get count of unread notifications */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await notificationFunctions.getUnreadCount(userId);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  /** Mark a notification as read */
  async markAsRead(id: string): Promise<void> {
    try {
      await notificationFunctions.markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  /** Mark all notifications as read */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await notificationFunctions.markAllAsRead(userId);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  /**
   * Subscribe to real-time notifications for a user.
   * Returns the channel so the caller can unsubscribe.
   */
  subscribe(userId: string, onNew: (notification: Notification) => void) {
    return notificationFunctions.subscribe(userId, (raw) => {
      onNew({
        id: raw.id,
        userId: raw.user_id,
        type: raw.type as any,
        title: raw.title,
        message: raw.message,
        read: raw.is_read,
        createdAt: raw.created_at,
      });
    });
  },

  /** Unsubscribe from real-time channel */
  async unsubscribe(channel: any): Promise<void> {
    try {
      await notificationFunctions.unsubscribe(channel);
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  },
};
