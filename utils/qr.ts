import { QRPayload, SubsidyQRPayload, PaidQRPayload, TransactionMode } from '../types';

export const generateQRData = (payload: QRPayload): string => {
  return JSON.stringify(payload);
};

export const parseQRData = (data: string): QRPayload | null => {
  try {
    const parsed = JSON.parse(data);
    
    // Validate QR payload structure
    if (parsed.mode === TransactionMode.SUBSIDY) {
      const subsidyPayload = parsed as SubsidyQRPayload;
      if (
        subsidyPayload.userId &&
        subsidyPayload.couponId &&
        subsidyPayload.fuelType &&
        typeof subsidyPayload.remainingAmount === 'number' &&
        subsidyPayload.expiry
      ) {
        return subsidyPayload;
      }
    } else if (parsed.mode === TransactionMode.PAID) {
      const paidPayload = parsed as PaidQRPayload;
      if (
        paidPayload.transactionId &&
        paidPayload.fuelType &&
        typeof paidPayload.paidAmount === 'number' &&
        paidPayload.expiry
      ) {
        return paidPayload;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
};

export const isQRExpired = (expiry: string): boolean => {
  return new Date(expiry) < new Date();
};

export const calculateLiters = (amount: number, fuelType: 'PETROL' | 'DIESEL'): number => {
  const price = fuelType === 'PETROL' ? 65 : 68;
  return Math.round((amount / price) * 100) / 100;
};
