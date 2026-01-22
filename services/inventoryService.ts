import { apiClient } from './api';
import { Inventory } from '../types';

export const inventoryService = {
  async getInventory(stationId: string): Promise<Inventory | null> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          stationId,
          stationName: 'Shell Station',
          petrolStock: 5000,
          dieselStock: 4500,
          lastUpdated: new Date().toISOString(),
        });
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.get<Inventory>(`/inventory/${stationId}`);
    // return response.success && response.data ? response.data : null;
  },

  async updateInventory(
    stationId: string,
    fuelType: 'PETROL' | 'DIESEL',
    liters: number
  ): Promise<boolean> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.put(`/inventory/${stationId}`, { fuelType, liters });
    // return response.success;
  },
};
