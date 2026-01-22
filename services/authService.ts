import { apiClient } from './api';
import { AuthResponse, User, UserRole } from '../types';
import { Storage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';

export const authService = {
  async sendOTP(phoneNumber: string): Promise<{ success: boolean; message?: string; error?: string }> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'OTP sent successfully',
        });
      }, 1000);
    });
    
    // Real implementation would be:
    // return apiClient.post('/auth/send-otp', { phoneNumber });
  },

  async verifyOTP(phoneNumber: string, otp: string): Promise<AuthResponse | null> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get signup data if available (from signup flow)
        const signupData = Storage.get<any>('signup_data');
        const selectedRole = Storage.get<UserRole>(STORAGE_KEYS.SELECTED_ROLE) || UserRole.USER;
        
        const mockUser: User = {
          id: '1',
          phoneNumber,
          role: selectedRole,
          name: signupData?.name || 'John Doe',
          email: signupData?.email || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // If attendant, add station info
        if (selectedRole === UserRole.ATTENDANT && signupData) {
          (mockUser as any).stationId = signupData.stationId;
          (mockUser as any).stationName = signupData.stationName;
        }

        resolve({
          user: mockUser,
          token: 'mock-jwt-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
        });
      }, 1000);
    });

    // Real implementation would be:
    // const response = await apiClient.post<AuthResponse>('/auth/verify-otp', { phoneNumber, otp });
    // if (response.success && response.data) {
    //   Storage.set(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
    //   Storage.set(STORAGE_KEYS.USER_DATA, response.data.user);
    //   return response.data;
    // }
    // return null;
  },

  async logout(): Promise<void> {
    // Clear all auth-related storage
    Storage.delete(STORAGE_KEYS.AUTH_TOKEN);
    Storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
    Storage.delete(STORAGE_KEYS.USER_DATA);
    Storage.delete(STORAGE_KEYS.SELECTED_ROLE);
    // Clear signup data if exists
    Storage.delete('signup_data');
  },

  getStoredUser(): User | null {
    return Storage.get<User>(STORAGE_KEYS.USER_DATA);
  },

  getStoredToken(): string | null {
    return Storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  },
};
