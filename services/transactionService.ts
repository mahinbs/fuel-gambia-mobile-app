import { apiClient } from './api';
import { Transaction } from '../types';

export const transactionService = {
  async getTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    fuelType?: string;
    mode?: string;
  }): Promise<Transaction[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            userId: '1',
            stationId: 'station1',
            stationName: 'Shell Station',
            fuelType: 'PETROL' as any,
            amount: 500,
            liters: 7.69,
            mode: 'SUBSIDY' as any,
            status: 'SUCCESS' as any,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            userId: '1',
            stationId: 'station2',
            stationName: 'Total Station',
            fuelType: 'DIESEL' as any,
            amount: 1000,
            liters: 14.71,
            mode: 'PAID' as any,
            status: 'SUCCESS' as any,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.get<Transaction[]>('/transactions', filters);
    // return response.success && response.data ? response.data : [];
  },

  async getTransactionById(id: string): Promise<Transaction | null> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          userId: '1',
          stationId: 'station1',
          stationName: 'Shell Station',
          fuelType: 'PETROL' as any,
          amount: 500,
          liters: 7.69,
          mode: 'SUBSIDY' as any,
          status: 'SUCCESS' as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    // return response.success && response.data ? response.data : null;
  },
};
