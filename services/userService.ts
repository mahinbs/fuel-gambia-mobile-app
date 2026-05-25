import { userFunctions } from '../supabase';
import { User } from '../types';

export const userService = {
  /** Get user profile by ID */
  async getProfile(userId: string): Promise<User | null> {
    try {
      const data = await userFunctions.getProfile(userId);
      if (!data) return null;
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phoneNumber: data.phone_number,
        role: data.role as any,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as User;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  /** Update user profile */
  async updateProfile(userId: string, updates: { name?: string; email?: string; avatarUrl?: string }): Promise<User | null> {
    try {
      const data = await userFunctions.updateProfile(userId, {
        name: updates.name,
        email: updates.email,
        avatar_url: updates.avatarUrl,
      });
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phoneNumber: data.phone_number,
        role: data.role as any,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as User;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  },

  /** Upload profile avatar */
  async uploadAvatar(userId: string, file: Blob): Promise<string | null> {
    try {
      return await userFunctions.uploadAvatar(userId, file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  },

  /** Check if a phone number is already registered */
  async isPhoneRegistered(phoneNumber: string): Promise<boolean> {
    try {
      return await userFunctions.isPhoneRegistered(phoneNumber);
    } catch (error) {
      console.error('Error checking phone:', error);
      return false;
    }
  },

  /** Get all active stations */
  async getStations(params: { search?: string } = {}) {
    try {
      return await userFunctions.getStations(params);
    } catch (error) {
      console.error('Error fetching stations:', error);
      return [];
    }
  },
};
