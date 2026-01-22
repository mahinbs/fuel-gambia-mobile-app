import { create } from 'zustand';
import { Transaction, PaymentIntent, PaymentStatus } from '../types';
import { transactionService } from '../services/transactionService';
import { paymentService } from '../services/paymentService';
import { QRCodeStatus } from './beneficiaryStore';

interface CustomerState {
  transactions: Transaction[];
  currentPaymentIntent: PaymentIntent | null;
  qrCodes: QRCodeStatus[];
  isLoading: boolean;
  fetchTransactions: () => Promise<void>;
  createPaymentIntent: (amount: number, fuelType: 'PETROL' | 'DIESEL') => Promise<void>;
  processPayment: (paymentMethod: string) => Promise<boolean>;
  clearPaymentIntent: () => void;
  saveQRCode: (qrCode: QRCodeStatus) => void;
  updateQRCodeStatus: (id: string, status: 'PENDING' | 'USED' | 'COMPLETE') => void;
  getPendingQRCodes: () => QRCodeStatus[];
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  transactions: [],
  currentPaymentIntent: null,
  qrCodes: [],
  isLoading: false,

  fetchTransactions: async () => {
    const transactions = await transactionService.getTransactions();
    set({ transactions });
  },

  createPaymentIntent: async (amount, fuelType) => {
    set({ isLoading: true });
    const paymentIntent = await paymentService.createPaymentIntent(amount, fuelType);
    set({ currentPaymentIntent: paymentIntent, isLoading: false });
  },

  processPayment: async (paymentMethod) => {
    const { currentPaymentIntent } = get();
    if (!currentPaymentIntent) return false;

    set({ isLoading: true });
    const result = await paymentService.processPayment(
      currentPaymentIntent.id,
      paymentMethod
    );
    set({ currentPaymentIntent: result, isLoading: false });

    if (result?.status === PaymentStatus.SUCCESS) {
      await get().fetchTransactions();
      return true;
    }
    return false;
  },

  clearPaymentIntent: () => {
    set({ currentPaymentIntent: null });
  },

  saveQRCode: (qrCode: QRCodeStatus) => {
    const { qrCodes } = get();
    const existingIndex = qrCodes.findIndex(qr => qr.id === qrCode.id);
    if (existingIndex >= 0) {
      const updated = [...qrCodes];
      updated[existingIndex] = qrCode;
      set({ qrCodes: updated });
    } else {
      set({ qrCodes: [...qrCodes, qrCode] });
    }
  },

  updateQRCodeStatus: (id: string, status: 'PENDING' | 'USED' | 'COMPLETE') => {
    const { qrCodes } = get();
    const updated = qrCodes.map(qr => 
      qr.id === id 
        ? { ...qr, status, usedAt: status === 'USED' || status === 'COMPLETE' ? new Date().toISOString() : qr.usedAt }
        : qr
    );
    set({ qrCodes: updated });
  },

  getPendingQRCodes: () => {
    const { qrCodes } = get();
    return qrCodes.filter(qr => qr.status === 'PENDING');
  },
}));
