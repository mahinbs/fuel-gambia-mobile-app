import { apiClient } from './api';
import { PaymentIntent, PaymentStatus, FuelType } from '../types';

export const paymentService = {
  async createPaymentIntent(amount: number, fuelType: FuelType): Promise<PaymentIntent | null> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'payment-' + Date.now(),
          amount,
          fuelType,
          status: PaymentStatus.PENDING,
        });
      }, 1000);
    });

    // Real implementation:
    // const response = await apiClient.post<PaymentIntent>('/payments/create', { amount, fuelType });
    // return response.success && response.data ? response.data : null;
  },

  async processPayment(paymentIntentId: string, paymentMethod: string): Promise<PaymentIntent | null> {
    // Mock implementation - simulate payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 90% success rate
        const success = Math.random() > 0.1;
        resolve({
          id: paymentIntentId,
          amount: 2000,
          fuelType: 'PETROL' as FuelType,
          status: success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          paymentMethod,
          transactionId: success ? 'txn-' + Date.now() : undefined,
        });
      }, 2000);
    });

    // Real implementation with Flutterwave/Paystack:
    // const response = await apiClient.post<PaymentIntent>('/payments/process', {
    //   paymentIntentId,
    //   paymentMethod,
    // });
    // return response.success && response.data ? response.data : null;
  },

  async verifyPayment(transactionId: string): Promise<PaymentIntent | null> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'payment-' + Date.now(),
          amount: 2000,
          fuelType: 'PETROL' as FuelType,
          status: PaymentStatus.SUCCESS,
          transactionId,
        });
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.get<PaymentIntent>(`/payments/verify/${transactionId}`);
    // return response.success && response.data ? response.data : null;
  },
};
