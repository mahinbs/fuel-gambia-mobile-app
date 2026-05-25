import { supabase } from '../utils/supabase';
import { Transaction } from '../types';

export const transactionService = {
  async getTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    fuelType?: string;
    mode?: string;
    userId?: string;
    attendantId?: string;
  }): Promise<Transaction[]> {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          station:stations(name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      } else if (filters?.attendantId) {
        query = query.eq('attendant_id', filters.attendantId);
      } else {
        // Default to current user if no filter
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.role === 'ATTENDANT') {
            query = query.eq('attendant_id', user.id);
          } else {
            query = query.eq('user_id', user.id);
          }
        }
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.fuelType) {
        query = query.eq('fuel_type', filters.fuelType);
      }
      if (filters?.mode) {
        query = query.eq('mode', filters.mode);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        stationId: item.station_id,
        stationName: (item as any).station?.name || 'Unknown Station',
        fuelType: item.fuel_type,
        amount: item.amount,
        liters: item.liters,
        mode: item.mode,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.created_at, // Supabase schema uses created_at
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          station:stations(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        stationId: data.station_id,
        stationName: (data as any).station?.name || 'Unknown Station',
        fuelType: data.fuel_type,
        amount: data.amount,
        liters: data.liters,
        mode: data.mode,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.created_at,
      };
    } catch (error) {
      console.error('Error fetching transaction by ID:', error);
      return null;
    }
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: transaction.userId,
          station_id: transaction.stationId,
          attendant_id: (transaction as any).attendantId,
          fuel_type: transaction.fuelType,
          amount: transaction.amount,
          liters: transaction.liters,
          mode: transaction.mode,
          status: transaction.status,
          qr_code: transaction.qrCode,
        })
        .select()
        .single();

      if (error) throw error;
      return data as any;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }
};
