export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.fuelgambia.com/api';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  SELECTED_ROLE: 'selected_role',
  ONBOARDING_COMPLETE: 'onboarding_complete',
} as const;

export const QR_EXPIRY_HOURS = {
  SUBSIDY: 24 * 30, // 30 days
  PAID: 24, // 24 hours
} as const;

export const FUEL_PRICES = {
  PETROL: 65, // GMD per liter
  DIESEL: 68, // GMD per liter
} as const;

export const LOW_STOCK_THRESHOLD = 1000; // liters

// Color Themes for Each Role
export const COLOR_THEMES = {
  USER: {
    primary: '#007AFF', // Dark Blue
    secondary: '#5AC8FA', // Light Blue
  },
  BENEFICIARY: {
    primary: '#007AFF', // Dark Blue
    secondary: '#5AC8FA', // Light Blue
  },
  ATTENDANT: {
    primary: '#007AFF', // Dark Blue
    secondary: '#5AC8FA', // Light Blue
  },
} as const;
