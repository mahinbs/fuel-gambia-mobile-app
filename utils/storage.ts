import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let storage: MMKV;
let initPromise: Promise<void> | null = null;

const fallbackStorage: { [key: string]: string } = {};

async function preloadAsyncStorage() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [key, value] of pairs) {
      if (value !== null) {
        fallbackStorage[key] = value;
      }
    }
  } catch (err) {
    console.warn('Failed to preload AsyncStorage in Storage fallback:', err);
  }
}

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
  console.warn('MMKV initialization warning (using AsyncStorage fallback):', error);
  // Fallback to AsyncStorage backed memory cache
  initPromise = preloadAsyncStorage();
  
  storage = {
    set: (key: string, value: string) => {
      fallbackStorage[key] = value;
      AsyncStorage.setItem(key, value).catch((err) => {
        console.error('AsyncStorage setItem error:', err);
      });
    },
    getString: (key: string) => fallbackStorage[key] || undefined,
    delete: (key: string) => {
      delete fallbackStorage[key];
      AsyncStorage.removeItem(key).catch((err) => {
        console.error('AsyncStorage removeItem error:', err);
      });
    },
    clearAll: () => {
      Object.keys(fallbackStorage).forEach((key) => delete fallbackStorage[key]);
      AsyncStorage.clear().catch((err) => {
        console.error('AsyncStorage clear error:', err);
      });
    },
  } as any;
}

export const Storage = {
  waitForLoading: async (): Promise<void> => {
    if (initPromise) {
      await initPromise;
    }
  },
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
