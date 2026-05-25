import { paymentFunctions, customerFunctions, supabase } from '../supabase';
import { Payment, PaymentIntent, FuelType } from '../types';

export const paymentService = {
  /** Get payment history for the current user */
  async getPayments(userId: string, params: { page?: number } = {}): Promise<{ data: Payment[]; total: number }> {
    try {
      const result = await paymentFunctions.getPayments(userId, params);
      return {
        data: (result.data || []).map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          transactionId: item.transaction_id,
          amount: Number(item.amount),
          fuelType: item.fuel_type,
          status: item.status,
          paymentMethod: item.payment_method,
          gatewayReference: item.gateway_reference,
          gatewayResponse: item.gateway_response,
          retryCount: item.retry_count || 0,
          refunded: item.refunded || false,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })) as Payment[],
        total: result.total,
      };
    } catch (error) {
      console.error('Error fetching payments:', error);
      return { data: [], total: 0 };
    }
  },

  /** Create a pending payment for fuel purchase */
  async createPayment(payload: {
    userId: string;
    amount: number;
    fuelType?: string;
    paymentMethod: string;
    transactionId?: string;
  }): Promise<Payment | null> {
    try {
      const data = await paymentFunctions.createPayment(payload) as any;
      return {
        id: data.id,
        userId: data.user_id,
        transactionId: data.transaction_id,
        amount: Number(data.amount),
        fuelType: data.fuel_type,
        status: data.status,
        paymentMethod: data.payment_method,
        retryCount: 0,
        refunded: false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      return null;
    }
  },

  /** Confirm payment success/failure */
  async confirmPayment(paymentId: string, gatewayRef: string, status: 'SUCCESS' | 'FAILED'): Promise<Payment | null> {
    try {
      const data = await paymentFunctions.confirmPayment(paymentId, gatewayRef, status) as any;
      return {
        id: data.id,
        userId: data.user_id,
        amount: Number(data.amount),
        status: data.status,
        paymentMethod: data.payment_method,
        retryCount: data.retry_count || 0,
        refunded: data.refunded || false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Payment;
    } catch (error) {
      console.error('Error confirming payment:', error);
      return null;
    }
  },

  /** Initiate wallet top-up */
  async initiateTopUp(userId: string, amount: number): Promise<boolean> {
    try {
      await customerFunctions.topUpWallet(userId, amount);
      return true;
    } catch (error) {
      console.error('Error topping up wallet:', error);
      return false;
    }
  },

  /** Create a payment intent (used by beneficiary/customer stores) */
  async createPaymentIntent(amount: number, fuelType: FuelType): Promise<PaymentIntent | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const payment = await this.createPayment({
        userId: user.id,
        amount,
        fuelType,
        paymentMethod: 'MOBILE_MONEY',
      });
      
      if (!payment) return null;
      
      return {
        id: payment.id,
        amount: payment.amount,
        fuelType: (payment.fuelType as FuelType) || fuelType,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return null;
    }
  },

  /** Process payment (used by beneficiary/customer stores) */
  async processPayment(paymentId: string, paymentMethod: string): Promise<PaymentIntent | null> {
    try {
      const gatewayRef = 'GW-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const payment = await this.confirmPayment(paymentId, gatewayRef, 'SUCCESS');
      if (!payment) return null;
      
      return {
        id: payment.id,
        amount: payment.amount,
        fuelType: (payment.fuelType as FuelType) || FuelType.PETROL,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return null;
    }
  },
};
