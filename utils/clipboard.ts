// Clipboard utility for Expo
export const Clipboard = {
  setStringAsync: async (text: string) => {
    // Mock implementation - in real app, use expo-clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  },
};
