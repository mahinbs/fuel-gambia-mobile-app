import { create } from 'zustand';
import { User, UserRole } from '../types';
import { Storage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      Storage.set(STORAGE_KEYS.USER_DATA, user);
    } else {
      Storage.delete(STORAGE_KEYS.USER_DATA);
    }
  },

  setToken: (token) => {
    set({ token });
    if (token) {
      Storage.set(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      Storage.delete(STORAGE_KEYS.AUTH_TOKEN);
    }
  },

  login: (user, token) => {
    set({ user, token, isAuthenticated: true });
    Storage.set(STORAGE_KEYS.USER_DATA, user);
    Storage.set(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    const user = authService.getStoredUser();
    const token = authService.getStoredToken();
    set({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading: false,
    });
  },
}));
