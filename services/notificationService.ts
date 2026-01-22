import { apiClient } from './api';
import { Notification } from '../types';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            userId: '1',
            title: 'Allocation Credited',
            message: 'Your monthly allocation of 2000 GMD has been credited',
            type: 'ALLOCATION',
            read: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            userId: '1',
            title: 'Low Balance Warning',
            message: 'Your remaining balance is below 500 GMD',
            type: 'BALANCE',
            read: false,
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.get<Notification[]>('/notifications');
    // return response.success && response.data ? response.data : [];
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.put(`/notifications/${notificationId}/read`);
    // return response.success;
  },

  async markAllAsRead(): Promise<boolean> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.put('/notifications/read-all');
    // return response.success;
  },
};
