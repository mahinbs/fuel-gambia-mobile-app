import { create } from 'zustand';
import { Inventory, Transaction, QRPayload } from '../types';
import { inventoryService } from '../services/inventoryService';
import { transactionService } from '../services/transactionService';

interface AttendantState {
  inventory: Inventory | null;
  scannedQR: QRPayload | null;
  recentTransactions: Transaction[];
  isLoading: boolean;
  fetchInventory: (stationId: string) => Promise<void>;
  scanQR: (qrData: QRPayload) => void;
  clearScannedQR: () => void;
  dispenseFuel: (liters: number, fuelType: 'PETROL' | 'DIESEL') => Promise<boolean>;
  fetchRecentTransactions: () => Promise<void>;
}

export const useAttendantStore = create<AttendantState>((set, get) => ({
  inventory: null,
  scannedQR: null,
  recentTransactions: [],
  isLoading: false,

  fetchInventory: async (stationId) => {
    set({ isLoading: true });
    try {
      const inventory = await inventoryService.getInventory(stationId);
      set({ inventory, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      // Set default inventory on error
      set({
        inventory: {
          stationId,
          stationName: 'Fuel Station',
          petrolStock: 0,
          dieselStock: 0,
          lastUpdated: new Date().toISOString(),
        },
        isLoading: false,
      });
    }
  },

  scanQR: (qrData) => {
    set({ scannedQR: qrData });
  },

  clearScannedQR: () => {
    set({ scannedQR: null });
  },

  dispenseFuel: async (liters, fuelType) => {
    const { inventory, scannedQR } = get();
    if (!inventory || !scannedQR) return false;

    set({ isLoading: true });

    // Update local inventory
    const updatedInventory = {
      ...inventory,
      petrolStock:
        fuelType === 'PETROL'
          ? inventory.petrolStock - liters
          : inventory.petrolStock,
      dieselStock:
        fuelType === 'DIESEL'
          ? inventory.dieselStock - liters
          : inventory.dieselStock,
      lastUpdated: new Date().toISOString(),
    };

    // Sync with backend
    const success = await inventoryService.updateInventory(
      inventory.stationId,
      fuelType,
      liters
    );

    if (success) {
      set({ inventory: updatedInventory });
      await get().fetchRecentTransactions();
    }

    set({ isLoading: false });
    return success;
  },

  fetchRecentTransactions: async () => {
    const transactions = await transactionService.getTransactions();
    set({ recentTransactions: transactions.slice(0, 10) });
  },
}));
