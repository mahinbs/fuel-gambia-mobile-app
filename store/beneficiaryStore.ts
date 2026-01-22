import { create } from 'zustand';
import { Beneficiary, VerificationStatus, Transaction, PaymentIntent, PaymentStatus } from '../types';
import { beneficiaryService } from '../services/beneficiaryService';
import { paymentService } from '../services/paymentService';

export interface QRCodeStatus {
  id: string;
  qrData: string;
  payload: any;
  status: 'PENDING' | 'USED' | 'COMPLETE';
  createdAt: string;
  usedAt?: string;
}

interface BeneficiaryState {
  beneficiary: Beneficiary | null;
  transactions: Transaction[];
  currentPaymentIntent: PaymentIntent | null;
  qrCodes: QRCodeStatus[];
  isLoading: boolean;
  fetchBeneficiary: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  updateBalance: (amount: number) => void;
  createPaymentIntent: (amount: number, fuelType: 'PETROL' | 'DIESEL') => Promise<void>;
  processPayment: (paymentMethod: string) => Promise<boolean>;
  clearPaymentIntent: () => void;
  saveQRCode: (qrCode: QRCodeStatus) => void;
  updateQRCodeStatus: (id: string, status: 'PENDING' | 'USED' | 'COMPLETE') => void;
  getPendingQRCodes: () => QRCodeStatus[];
}

export const useBeneficiaryStore = create<BeneficiaryState>((set, get) => ({
  beneficiary: null,
  transactions: [],
  currentPaymentIntent: null,
  qrCodes: [],
  isLoading: false,

  fetchBeneficiary: async () => {
    set({ isLoading: true });
    const beneficiary = await beneficiaryService.getBeneficiaryData();
    set({ beneficiary, isLoading: false });
  },

  fetchTransactions: async () => {
    const transactions = await beneficiaryService.getTransactions();
    set({ transactions });
  },

  updateBalance: (amount: number) => {
    const { beneficiary } = get();
    if (beneficiary) {
      set({
        beneficiary: {
          ...beneficiary,
          remainingBalance: Math.max(0, beneficiary.remainingBalance - amount),
        },
      });
    }
  },

  createPaymentIntent: async (amount, fuelType) => {
    set({ isLoading: true });
    const paymentIntent = await paymentService.createPaymentIntent(amount, fuelType);
    set({ currentPaymentIntent: paymentIntent, isLoading: false });
  },

  processPayment: async (paymentMethod: string) => {
    const { currentPaymentIntent } = get();
    if (!currentPaymentIntent) return false;

    set({ isLoading: true });
    const result = await paymentService.processPayment(
      currentPaymentIntent.id,
      paymentMethod
    );
    // Update payment intent with the result (keep it for QR code generation)
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
    // Check if QR code already exists
    const existingIndex = qrCodes.findIndex(qr => qr.id === qrCode.id);
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...qrCodes];
      updated[existingIndex] = qrCode;
      set({ qrCodes: updated });
    } else {
      // Add new
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
