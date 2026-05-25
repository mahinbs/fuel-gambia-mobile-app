import { supabase } from '../utils/supabase';
import { Beneficiary, VerificationStatus, Transaction } from '../types';

export const beneficiaryService = {
  async getBeneficiaryData(): Promise<Beneficiary | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (profile.role !== 'BENEFICIARY') return null;

      const { data: beneficiary, error: beneficiaryError } = await supabase
        .from('beneficiaries')
        .select('*, department:departments(name)')
        .eq('id', user.id)
        .single();

      if (beneficiaryError && beneficiaryError.code !== 'PGRST116') throw beneficiaryError;

      return {
        id: profile.id,
        phoneNumber: profile.phone_number,
        role: profile.role as any,
        name: profile.name,
        verificationStatus: (beneficiary?.verification_status as VerificationStatus) || VerificationStatus.PENDING,
        monthlyAllocation: Number(beneficiary?.monthly_allocation || 0),
        remainingBalance: Number(beneficiary?.remaining_balance || 0),
        fuelType: beneficiary?.fuel_type as any || 'PETROL',
        expiryDate: beneficiary?.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        governmentId: beneficiary?.government_id || profile.government_id || '',
        departmentName: beneficiary?.department?.name || profile.department_name || '',
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      } as Beneficiary;
    } catch (error) {
      console.error('Error getting beneficiary data:', error);
      return null;
    }
  },

  async uploadDocuments(data: {
    governmentId: string;
    employmentLetter: string;
    departmentName: string;
    userId?: string;
  }): Promise<boolean> {
    try {
      let uid = data.userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        uid = user.id;
      }

      // 1. Find or create department
      let { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('name', data.departmentName)
        .single();

      if (!dept) {
        const { data: newDept, error: deptError } = await supabase
          .from('departments')
          .insert({ name: data.departmentName, code: data.departmentName.substring(0, 3).toUpperCase() })
          .select()
          .single();
        if (deptError) throw deptError;
        dept = newDept;
      }

      // 2. Upsert beneficiary record
      const { error } = await supabase
        .from('beneficiaries')
        .upsert({
          id: uid,
          government_id: data.governmentId,
          department_id: dept?.id,
          verification_status: 'PENDING',
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error uploading documents:', error);
      return false;
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          station:stations(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        stationId: item.station_id,
        stationName: (item as any).station?.name || 'Unknown Station',
        fuelType: item.fuel_type as any,
        amount: item.amount,
        liters: item.liters,
        mode: item.mode as any,
        status: item.status as any,
        createdAt: item.created_at,
        updatedAt: item.created_at,
      }));
    } catch (error) {
      console.error('Error fetching beneficiary transactions:', error);
      return [];
    }
  },

  async verifyBeneficiary(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('beneficiaries')
        .update({ verification_status: 'APPROVED', updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error verifying beneficiary:', error);
      return false;
    }
  },
};
