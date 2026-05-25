/**
 * Fuel Gambia Mobile App — Supabase Integration Functions
 *
 * All Supabase DB functions for the mobile app (Expo/React Native).
 * Covers: Auth, Customer, Beneficiary, Attendant flows.
 *
 * Usage:
 *   import { authFunctions, customerFunctions, ... } from '../supabase';
 */

import { supabase } from '../utils/supabase';

// ─────────────────────────────────────────────
// AUTH FUNCTIONS
// ─────────────────────────────────────────────
export const authFunctions = {
  /** Send OTP to phone number */
  async sendOTP(phone: string) {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
    return { success: true };
  },

  /** Verify OTP and get session */
  async verifyOTP(phone: string, otp: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    if (error) throw error;
    return data;
  },

  /** Sign out */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /** Get current authenticated user */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /** Get current session */
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  /** Get full profile for current user */
  async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data;
  },

  /** Update user profile */
  async updateProfile(id: string, updates: { name?: string; email?: string; avatar_url?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Register new user profile after OTP verification */
  async createProfile(payload: {
    id: string;
    name: string;
    phoneNumber: string;
    email?: string;
    role: 'CUSTOMER' | 'BENEFICIARY' | 'ATTENDANT';
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: payload.id,
        name: payload.name,
        phone_number: payload.phoneNumber,
        email: payload.email,
        role: payload.role,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─────────────────────────────────────────────
// CUSTOMER FUNCTIONS
// ─────────────────────────────────────────────
export const customerFunctions = {
  /** Get customer wallet and status */
  async getCustomerData(userId: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      // Create customer record if not exists
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({ id: userId, wallet_balance: 0, status: 'ACTIVE' })
        .select()
        .single();
      if (insertError) throw insertError;
      return newCustomer;
    }
    return data;
  },

  /** Top up wallet */
  async topUpWallet(userId: string, amount: number) {
    const { data, error } = await supabase.rpc('increment_wallet', {
      p_user_id: userId,
      p_amount: amount,
    }).single();
    // Fallback if RPC not available: direct update
    if (error) {
      const { data: current } = await supabase.from('customers').select('wallet_balance').eq('id', userId).single();
      const { data: updated, error: updateError } = await supabase
        .from('customers')
        .update({ wallet_balance: Number(current?.wallet_balance || 0) + amount, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (updateError) throw updateError;
      return updated;
    }
    return data;
  },

  /** Get customer's transaction history */
  async getTransactions(userId: string, params: { page?: number; fuelType?: string; mode?: string } = {}) {
    const page = params.page || 1;
    const from = (page - 1) * 20;
    let query = supabase
      .from('transactions')
      .select('*, station:stations(name)', { count: 'exact' })
      .eq('user_id', userId);
    if (params.fuelType) query = query.eq('fuel_type', params.fuelType);
    if (params.mode) query = query.eq('mode', params.mode);
    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, from + 19);
    if (error) throw error;
    return { data: data || [], total: count || 0 };
  },

  /** Initiate a fuel purchase (creates a payment record) */
  async initiatePurchase(payload: {
    userId: string;
    stationId: string;
    fuelType: 'PETROL' | 'DIESEL';
    liters: number;
    amount: number;
    paymentMethod: 'MOBILE_MONEY' | 'CARD' | 'WALLET';
  }) {
    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: payload.userId,
        amount: payload.amount,
        fuel_type: payload.fuelType,
        status: 'PENDING',
        payment_method: payload.paymentMethod,
      })
      .select()
      .single();
    if (paymentError) throw paymentError;
    return payment;
  },

  /** Complete a purchase after payment confirmation */
  async completePurchase(paymentId: string, gatewayReference: string, gatewayResponse?: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'SUCCESS',
        gateway_reference: gatewayReference,
        gateway_response: gatewayResponse,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Get nearby stations */
  async getNearbyStations(limit = 10) {
    const { data, error } = await supabase
      .from('stations')
      .select('id, name, location, address, fuel_types, petrol_stock, diesel_stock, status, latitude, longitude')
      .eq('status', 'ACTIVE')
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};

// ─────────────────────────────────────────────
// BENEFICIARY FUNCTIONS
// ─────────────────────────────────────────────
export const beneficiaryFunctions = {
  /** Get full beneficiary data */
  async getBeneficiaryData(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (profileError) throw profileError;

    const { data: beneficiary, error: bError } = await supabase
      .from('beneficiaries')
      .select('*, department:departments(name)')
      .eq('id', userId)
      .single();
    if (bError && bError.code !== 'PGRST116') throw bError;

    return { profile, beneficiary };
  },

  /** Upload verification documents */
  async submitVerificationDocs(payload: {
    userId: string;
    governmentId: string;
    departmentName: string;
    governmentIdUrl?: string;
    employmentLetterUrl?: string;
  }) {
    // Find or create department
    let { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('name', payload.departmentName)
      .single();

    if (!dept) {
      const { data: newDept, error: deptError } = await supabase
        .from('departments')
        .insert({
          name: payload.departmentName,
          code: payload.departmentName.slice(0, 6).toUpperCase().replace(/\s/g, '_'),
        })
        .select()
        .single();
      if (deptError) throw deptError;
      dept = newDept;
    }

    // Upsert beneficiary
    const { data, error } = await supabase
      .from('beneficiaries')
      .upsert({
        id: payload.userId,
        government_id: payload.governmentId,
        department_id: dept?.id,
        government_id_url: payload.governmentIdUrl,
        employment_letter_url: payload.employmentLetterUrl,
        verification_status: 'PENDING',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Get beneficiary's active coupons */
  async getActiveCoupons(userId: string) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('beneficiary_id', userId)
      .eq('status', 'ACTIVE')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  /** Get all coupons (active + used) */
  async getAllCoupons(userId: string) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*, station:stations!coupons_used_at_station_fkey(name)')
      .eq('beneficiary_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /** Get beneficiary's coupon allocations */
  async getAllocations(userId: string) {
    const { data, error } = await supabase
      .from('coupon_allocations')
      .select('*')
      .eq('beneficiary_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /** Get beneficiary transactions */
  async getTransactions(userId: string, params: { page?: number } = {}) {
    const page = params.page || 1;
    const from = (page - 1) * 20;
    const { data, count, error } = await supabase
      .from('transactions')
      .select('*, station:stations(name)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + 19);
    if (error) throw error;
    return { data: data || [], total: count || 0 };
  },

  /** Upload file to Supabase Storage */
  async uploadDocument(userId: string, file: Blob, fileName: string, bucket = 'documents') {
    const path = `${userId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  },
};

// ─────────────────────────────────────────────
// ATTENDANT FUNCTIONS
// ─────────────────────────────────────────────
export const attendantFunctions = {
  /** Get attendant's station and current status */
  async getAttendantData(userId: string) {
    const { data, error } = await supabase
      .from('attendants')
      .select('*, station:stations(*, pumps(*))')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /** Get today's shift for attendant */
  async getTodayShift(userId: string, stationId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        pump_assignments!inner(
          *,
          pump:pumps(pump_label, fuel_type)
        )
      `)
      .eq('station_id', stationId)
      .eq('shift_date', today)
      .eq('pump_assignments.attendant_id', userId)
      .eq('status', 'OPEN')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /** Record opening meter reading */
  async recordOpeningReading(payload: {
    shiftId: string;
    pumpId: string;
    attendantId: string;
    petrolReading: number;
    dieselReading: number;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('meter_readings')
      .insert({
        shift_id: payload.shiftId,
        pump_id: payload.pumpId,
        attendant_id: payload.attendantId,
        reading_type: 'OPENING',
        petrol_reading: payload.petrolReading,
        diesel_reading: payload.dieselReading,
        notes: payload.notes,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Record closing meter reading */
  async recordClosingReading(payload: {
    shiftId: string;
    pumpId: string;
    attendantId: string;
    petrolReading: number;
    dieselReading: number;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('meter_readings')
      .insert({
        shift_id: payload.shiftId,
        pump_id: payload.pumpId,
        attendant_id: payload.attendantId,
        reading_type: 'CLOSING',
        petrol_reading: payload.petrolReading,
        diesel_reading: payload.dieselReading,
        notes: payload.notes,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Get readings for current shift */
  async getShiftReadings(shiftId: string) {
    const { data, error } = await supabase
      .from('meter_readings')
      .select('*, pump:pumps(pump_label, fuel_type)')
      .eq('shift_id', shiftId)
      .order('recorded_at');
    if (error) throw error;
    return data || [];
  },

  /** Validate and redeem a QR coupon (atomic RPC) */
  async validateQRCoupon(payload: {
    qrPayload: string;
    stationId: string;
    attendantId: string;
    liters: number;
  }) {
    const { data, error } = await supabase.rpc('validate_and_redeem_coupon', {
      p_qr_payload: payload.qrPayload,
      p_station_id: payload.stationId,
      p_attendant_id: payload.attendantId,
      p_liters: payload.liters,
    });
    if (error) throw error;
    return data;
  },

  /** Record a cash sale (atomic RPC) */
  async recordCashSale(payload: {
    stationId: string;
    attendantId: string;
    userId?: string;
    fuelType: 'PETROL' | 'DIESEL';
    liters: number;
    amount: number;
    shiftId?: string;
    pumpId?: string;
  }) {
    const { data, error } = await supabase.rpc('record_cash_sale', {
      p_station_id: payload.stationId,
      p_attendant_id: payload.attendantId,
      p_user_id: payload.userId || null,
      p_fuel_type: payload.fuelType,
      p_liters: payload.liters,
      p_amount: payload.amount,
      p_shift_id: payload.shiftId || null,
      p_pump_id: payload.pumpId || null,
    });
    if (error) throw error;
    return data;
  },

  /** Get attendant's transaction history */
  async getTransactions(attendantId: string, params: { page?: number; date?: string } = {}) {
    const page = params.page || 1;
    const from = (page - 1) * 20;
    let query = supabase
      .from('transactions')
      .select('*, user:profiles!transactions_user_id_fkey(name)', { count: 'exact' })
      .eq('attendant_id', attendantId);
    if (params.date) {
      query = query
        .gte('created_at', `${params.date}T00:00:00`)
        .lte('created_at', `${params.date}T23:59:59`);
    }
    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, from + 19);
    if (error) throw error;
    return { data: data || [], total: count || 0 };
  },

  /** Get station inventory */
  async getStationInventory(stationId: string) {
    const { data, error } = await supabase
      .from('stations')
      .select('id, name, petrol_stock, diesel_stock, low_stock_threshold, updated_at')
      .eq('id', stationId)
      .single();
    if (error) throw error;
    return data;
  },

  /** Record fuel delivery (supervisor) */
  async recordDelivery(payload: {
    stationId: string;
    receivedBy: string;
    fuelType: 'PETROL' | 'DIESEL';
    orderedLiters: number;
    deliveredLiters: number;
    deliveryNote?: string;
    supplierName?: string;
  }) {
    const { data, error } = await supabase.rpc('process_fuel_delivery', {
      p_station_id: payload.stationId,
      p_received_by: payload.receivedBy,
      p_fuel_type: payload.fuelType,
      p_ordered_liters: payload.orderedLiters,
      p_delivered_liters: payload.deliveredLiters,
      p_delivery_note: payload.deliveryNote || null,
      p_supplier_name: payload.supplierName || null,
    });
    if (error) throw error;
    return data;
  },

  /** Submit monthly reconciliation */
  async submitReconciliation(payload: {
    stationId: string;
    periodMonth: number;
    periodYear: number;
    fuelType: 'PETROL' | 'DIESEL';
    closingStockPhysical: number;
    reconciledBy: string;
  }) {
    const { data, error } = await supabase.rpc('calculate_reconciliation', {
      p_station_id: payload.stationId,
      p_period_month: payload.periodMonth,
      p_period_year: payload.periodYear,
      p_fuel_type: payload.fuelType,
      p_closing_stock_physical: payload.closingStockPhysical,
      p_reconciled_by: payload.reconciledBy,
    });
    if (error) throw error;
    return data;
  },
};

// ─────────────────────────────────────────────
// NOTIFICATION FUNCTIONS
// ─────────────────────────────────────────────
export const notificationFunctions = {
  /** Get all notifications for user */
  async getNotifications(userId: string, unreadOnly = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);
    if (unreadOnly) query = query.eq('is_read', false);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  },

  /** Get unread count */
  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return count || 0;
  },

  /** Mark single notification as read */
  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw error;
  },

  /** Mark all as read */
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },

  /** Subscribe to real-time notifications */
  subscribe(userId: string, onNew: (notification: any) => void) {
    return supabase
      .channel(`mobile-notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => onNew(payload.new))
      .subscribe();
  },

  /** Unsubscribe from channel */
  async unsubscribe(channel: ReturnType<typeof supabase.channel>) {
    await supabase.removeChannel(channel);
  },
};

// ─────────────────────────────────────────────
// PAYMENT FUNCTIONS (Mobile)
// ─────────────────────────────────────────────
export const paymentFunctions = {
  /** Get payment history for user */
  async getPayments(userId: string, params: { page?: number } = {}) {
    const page = params.page || 1;
    const from = (page - 1) * 20;
    const { data, count, error } = await supabase
      .from('payments')
      .select('*, transaction:transactions!payments_transaction_id_fkey(reference_number, liters, fuel_type)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + 19);
    if (error) throw error;
    return { data: data || [], total: count || 0 };
  },

  /** Create a pending payment record */
  async createPayment(payload: {
    userId: string;
    amount: number;
    fuelType?: string;
    paymentMethod: string;
    transactionId?: string;
  }) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: payload.userId,
        amount: payload.amount,
        fuel_type: payload.fuelType,
        payment_method: payload.paymentMethod,
        transaction_id: payload.transactionId,
        status: 'PENDING',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Update payment after gateway confirmation */
  async confirmPayment(paymentId: string, gatewayRef: string, status: 'SUCCESS' | 'FAILED') {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status,
        gateway_reference: gatewayRef,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─────────────────────────────────────────────
// USER / PROFILE FUNCTIONS (Mobile)
// ─────────────────────────────────────────────
export const userFunctions = {
  /** Get user profile */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  /** Update profile */
  async updateProfile(userId: string, updates: {
    name?: string;
    email?: string;
    avatar_url?: string;
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Upload profile avatar */
  async uploadAvatar(userId: string, file: Blob) {
    const path = `avatars/${userId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: 'image/jpeg' });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    // Update profile with new avatar URL
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId);
    return data.publicUrl;
  },

  /** Check if phone number is already registered */
  async isPhoneRegistered(phoneNumber: string) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('phone_number', phoneNumber);
    return (count || 0) > 0;
  },

  /** Get all active stations for map/list view */
  async getStations(params: { search?: string } = {}) {
    let query = supabase
      .from('stations')
      .select('id, name, location, address, fuel_types, petrol_stock, diesel_stock, latitude, longitude, status')
      .eq('status', 'ACTIVE');
    if (params.search) query = query.ilike('name', `%${params.search}%`);
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data || [];
  },
};

// ─────────────────────────────────────────────
// Re-export supabase client for direct access
// ─────────────────────────────────────────────
export { supabase };
