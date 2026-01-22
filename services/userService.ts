import { apiClient } from './api';
import { User, Beneficiary } from '../types';

export const userService = {
  async getProfile(): Promise<User | null> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: '1',
          phoneNumber: '+2201234567',
          role: 'CUSTOMER' as any,
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.get<User>('/user/profile');
    // return response.success && response.data ? response.data : null;
  },

  async updateProfile(data: Partial<User>): Promise<User | null> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: '1',
          phoneNumber: '+2201234567',
          role: 'CUSTOMER' as any,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.put<User>('/user/profile', data);
    // return response.success && response.data ? response.data : null;
  },
};
