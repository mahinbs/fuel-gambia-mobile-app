import { supabase } from '../utils/supabase';
import { AuthResponse, User, UserRole } from '../types';
import { Storage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';

async function populateStationId(userId: string): Promise<string | undefined> {
  try {
    const { data: attData } = await supabase
      .from('attendants')
      .select('station_id')
      .eq('id', userId)
      .maybeSingle();

    if (attData?.station_id) {
      return attData.station_id;
    }

    const { data: staffData } = await supabase
      .from('staff')
      .select('station_id')
      .eq('id', userId)
      .maybeSingle();

    return staffData?.station_id || undefined;
  } catch (error) {
    console.error('Error populating station ID:', error);
    return undefined;
  }
}

export const authService = {
  populateStationId,
  async sendOTP(phone: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send OTP',
      };
    }
  },

  async verifyOTP(phone: string, otp: string): Promise<AuthResponse | null> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      if (data.user && data.session) {
        // Fetch user profile from public.profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        const user: User = {
          id: profile.id,
          role: (profile.role === 'ATTENDANT' ? UserRole.ATTENDANT : UserRole.USER) as UserRole,
          name: profile.name,
          phoneNumber: profile.phone_number,
          email: profile.email,
          isBeneficiary: profile.role === 'BENEFICIARY',
          isVerified: profile.is_verified,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        };

        if (user.role === UserRole.ATTENDANT) {
          user.stationId = await populateStationId(user.id);
        }

        Storage.set(STORAGE_KEYS.AUTH_TOKEN, data.session.access_token);
        Storage.set(STORAGE_KEYS.REFRESH_TOKEN, data.session.refresh_token);
        Storage.set(STORAGE_KEYS.USER_DATA, user);
        Storage.set(STORAGE_KEYS.SELECTED_ROLE, user.role);

        return {
          user,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
        };
      }
      return null;
    } catch (error: any) {
      console.error('OTP Verification Error:', error);
      return null;
    }
  },

  async signup(data: any): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role, // 'CUSTOMER' or 'BENEFICIARY'
            phone_number: data.phoneNumber,
            address: data.address,
            sex: data.sex,
            company_name: data.companyName,
            department_name: data.departmentName,
            station_name: data.stationName,
            kyc_document_1_url: data.kycDocument1Url || data.idImage,
            kyc_document_2_url: data.kycDocument2Url,
            kyc_document_3_url: data.kycDocument3Url,
            is_verified: false,
          },
        },
      });

      if (error) throw error;

      return {
        success: true,
        user: authData.user,
      };
    } catch (error: any) {
      console.error('Signup Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign up',
      };
    }
  },

  async verifyEmailOTP(email: string, token: string, role: string, signupData?: any): Promise<AuthResponse | null> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      let { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type: 'signup',
      });

      if (error) {
        // fallback
        const { data: fallbackData, error: fallbackError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token,
          type: 'email',
        });
        if (fallbackError) throw fallbackError;
        data = fallbackData;
      }

      if (data.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', data.user.id);
        if (updateError) throw updateError;
        
        // Also ensure roles are initialized!
        if (role === 'CUSTOMER') {
          await supabase.from('customers').upsert({
            id: data.user.id,
            wallet_balance: 0,
            status: 'ACTIVE',
            updated_at: new Date().toISOString()
          });
        } else if (role === 'BENEFICIARY') {
          let deptId = null;
          if (signupData?.departmentName) {
            let { data: dept } = await supabase
              .from('departments')
              .select('id')
              .eq('name', signupData.departmentName)
              .single();
              
            if (!dept) {
              const { data: newDept } = await supabase
                .from('departments')
                .insert({
                  name: signupData.departmentName,
                  code: signupData.departmentName.slice(0, 6).toUpperCase().replace(/\s/g, '_'),
                })
                .select()
                .single();
              deptId = newDept?.id;
            } else {
              deptId = dept.id;
            }
          }
          
          // Store government_id and department_id on profiles table directly
          await supabase
            .from('profiles')
            .update({
              government_id: signupData?.governmentId || '',
              department_id: deptId,
            })
            .eq('id', data.user.id);

          await supabase.from('beneficiaries').upsert({
            id: data.user.id,
            government_id: signupData?.governmentId || '',
            department_id: deptId,
            government_id_url: signupData?.kycDocument1Url || signupData?.idImage || '',
            employment_letter_url: signupData?.kycDocument2Url || '',
            verification_status: 'PENDING',
            monthly_allocation: 0,
            remaining_balance: 0,
            updated_at: new Date().toISOString()
          });
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        const user: User = {
          id: profile.id,
          role: (profile.role === 'ATTENDANT' ? UserRole.ATTENDANT : UserRole.USER) as UserRole,
          name: profile.name,
          phoneNumber: profile.phone_number,
          email: profile.email,
          isBeneficiary: profile.role === 'BENEFICIARY',
          isVerified: profile.is_verified,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        };

        if (user.role === UserRole.ATTENDANT) {
          user.stationId = await populateStationId(user.id);
        }

        if (data.session) {
          Storage.set(STORAGE_KEYS.AUTH_TOKEN, data.session.access_token);
          Storage.set(STORAGE_KEYS.REFRESH_TOKEN, data.session.refresh_token);
        }
        Storage.set(STORAGE_KEYS.USER_DATA, user);
        Storage.set(STORAGE_KEYS.SELECTED_ROLE, user.role);

        return {
          user,
          token: data.session?.access_token || '',
          refreshToken: data.session?.refresh_token || '',
        };
      }
      return null;
    } catch (error: any) {
      console.error('Email OTP Verification Error:', error);
      return null;
    }
  },

  async loginWithPassword(email: string, password: string): Promise<AuthResponse | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (data.user && data.session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        const user: User = {
          id: profile.id,
          role: (profile.role === 'ATTENDANT' ? UserRole.ATTENDANT : UserRole.USER) as UserRole,
          name: profile.name,
          phoneNumber: profile.phone_number,
          email: profile.email,
          isBeneficiary: profile.role === 'BENEFICIARY',
          isVerified: profile.is_verified,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        };

        if (user.role === UserRole.ATTENDANT) {
          user.stationId = await populateStationId(user.id);
        }

        Storage.set(STORAGE_KEYS.AUTH_TOKEN, data.session.access_token);
        Storage.set(STORAGE_KEYS.REFRESH_TOKEN, data.session.refresh_token);
        Storage.set(STORAGE_KEYS.USER_DATA, user);
        Storage.set(STORAGE_KEYS.SELECTED_ROLE, user.role);

        return {
          user,
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
        };
      }
      return null;
    } catch (error: any) {
      console.error('Password Login Error:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    Storage.delete(STORAGE_KEYS.AUTH_TOKEN);
    Storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
    Storage.delete(STORAGE_KEYS.USER_DATA);
    Storage.delete(STORAGE_KEYS.SELECTED_ROLE);
    Storage.delete('signup_data');
  },

  getStoredUser(): User | null {
    return Storage.get<User>(STORAGE_KEYS.USER_DATA);
  },

  getStoredToken(): string | null {
    return Storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  },

  async getCurrentSession() {
    return await supabase.auth.getSession();
  }
};
