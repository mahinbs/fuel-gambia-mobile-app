import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';

let storage: MMKV;

try {
  // MMKV doesn't support encryptionKey on web
  if (Platform.OS === 'web') {
    storage = new MMKV({
      id: 'fuel-gambia-storage',
    });
  } else {
    storage = new MMKV({
      id: 'fuel-gambia-storage',
      encryptionKey: 'fuel-gambia-encryption-key-2024',
    });
  }
} catch (error) {
  console.error('MMKV initialization error:', error);
  // Fallback to a basic implementation if MMKV fails
  const fallbackStorage: { [key: string]: string } = {};
  storage = {
    set: (key: string, value: string) => {
      fallbackStorage[key] = value;
    },
    getString: (key: string) => fallbackStorage[key] || undefined,
    delete: (key: string) => {
      delete fallbackStorage[key];
    },
    clearAll: () => {
      Object.keys(fallbackStorage).forEach((key) => delete fallbackStorage[key]);
    },
  } as any;
}

export const Storage = {
  set: <T>(key: string, value: T): void => {
    try {
      storage.set(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  get: <T>(key: string): T | null => {
    try {
      const value = storage.getString(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  delete: (key: string): void => {
    try {
      storage.delete(key);
    } catch (error) {
      console.error('Storage delete error:', error);
    }
  },
  clear: (): void => {
    try {
      storage.clearAll();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },
};
