import { create } from 'zustand';
import { Inventory, Transaction, QRPayload, FuelType, TransactionMode, PaymentStatus } from '../types';
import { inventoryService } from '../services/inventoryService';
import { transactionService } from '../services/transactionService';
import { supabase } from '../utils/supabase';

interface AttendantState {
  inventory: Inventory | null;
  scannedQR: QRPayload | null;
  recentTransactions: Transaction[];
  isLoading: boolean;
  fetchInventory: (stationId: string) => Promise<void>;
  scanQR: (qrData: QRPayload) => void;
  clearScannedQR: () => void;
  dispenseFuel: (liters: number, fuelType: FuelType) => Promise<boolean>;
  recordCashSale: (saleData: { fuelType: FuelType; amount: number; liters: number }) => Promise<boolean>;
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
      if (!inventory) {
        throw new Error('Inventory not found or failed to fetch');
      }
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
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'SUCCESS',
          attendant_id: authUser?.id,
          station_id: inventory.stationId,
        })
        .eq('id', (scannedQR as any).transactionId);

      if (error) throw error;

      // Reload inventory and recent transactions to reflect stock/completion
      await get().fetchInventory(inventory.stationId);
      await get().fetchRecentTransactions();

      set({ isLoading: false });
      return true;
    } catch (err) {
      console.error('Dispense fuel error:', err);
      set({ isLoading: false });
      return false;
    }
  },

  recordCashSale: async (saleData) => {
    const { inventory } = get();
    if (!inventory) return false;

    set({ isLoading: true });

    // Update local inventory
    const updatedInventory = {
      ...inventory,
      petrolStock:
        saleData.fuelType === FuelType.PETROL
          ? inventory.petrolStock - saleData.liters
          : inventory.petrolStock,
      dieselStock:
        saleData.fuelType === FuelType.DIESEL
          ? inventory.dieselStock - saleData.liters
          : inventory.dieselStock,
      lastUpdated: new Date().toISOString(),
    };

    // In a real app, we'd call an API to record the transaction
    // and potentially another one to update inventory.
    // Sync with backend (mock)
    const success = await inventoryService.updateInventory(
      inventory.stationId,
      saleData.fuelType,
      saleData.liters
    );

    if (success) {
      set({ inventory: updatedInventory });
      
      // Create a mock transaction record to show in recent transactions
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        userId: 'cash-customer',
        stationId: inventory.stationId,
        stationName: inventory.stationName,
        fuelType: saleData.fuelType,
        amount: saleData.amount,
        liters: saleData.liters,
        mode: TransactionMode.PAID,
        status: PaymentStatus.SUCCESS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        recentTransactions: [newTransaction, ...state.recentTransactions].slice(0, 10),
      }));
    }

    set({ isLoading: false });
    return success;
  },

  fetchRecentTransactions: async () => {
    const transactions = await transactionService.getTransactions();
    set({ recentTransactions: transactions.slice(0, 10) });
  },
}));
