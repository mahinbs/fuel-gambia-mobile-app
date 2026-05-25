import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../utils/supabase';
import { useAuthStore } from '../../store';
import { UserRole } from '../../types';

const verificationSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type VerificationFormData = z.infer<typeof verificationSchema>;

export default function AttendantVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const { user, setUser, login } = useAuthStore();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (email) {
      sendOTP();
    }
  }, [email]);

  const sendOTP = async () => {
    if (!email) return;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        // Try fallback signInWithOtp to generate OTP for email
        const { error: fallbackError } = await supabase.auth.signInWithOtp({
          email: email,
        });
        if (fallbackError) throw fallbackError;
      }
      Alert.alert('Verification Code Sent', 'An 8-digit verification code has been sent to ' + email);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 500);
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      Alert.alert('Error', 'Failed to send verification code. ' + err.message);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async (data: VerificationFormData) => {
    const otpString = otp.join('');
    if (otpString.length !== 8) {
      Alert.alert('Validation Error', 'Please enter the 8-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP
      let { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpString,
        type: 'signup',
      });

      if (verifyError) {
        // Fallback email confirmation check
        const { data: fallbackData, error: fallbackError } = await supabase.auth.verifyOtp({
          email,
          token: otpString,
          type: 'email',
        });
        if (fallbackError) throw fallbackError;
        verifyData = fallbackData;
      }

      if (!verifyData.user) {
        throw new Error('Verification failed. User profile could not be verified.');
      }

      // 2. Set Password (hashes and updates in Supabase Auth automatically)
      const { error: passwordError } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (passwordError) throw passwordError;

      // 3. Mark profiles.is_verified = TRUE in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', verifyData.user.id);
      if (profileError) throw profileError;

      // 4. Fetch updated profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', verifyData.user.id)
        .single();
      if (fetchError) throw fetchError;

      // Fetch station_id
      let stationId: string | undefined;
      const { data: attData } = await supabase
        .from('attendants')
        .select('station_id')
        .eq('id', profile.id)
        .maybeSingle();

      if (attData?.station_id) {
        stationId = attData.station_id;
      } else {
        const { data: staffData } = await supabase
          .from('staff')
          .select('station_id')
          .eq('id', profile.id)
          .maybeSingle();
        stationId = staffData?.station_id || undefined;
      }

      // 5. Update auth state and log in
      const updatedUser = {
        id: profile.id,
        role: UserRole.ATTENDANT,
        name: profile.name,
        phoneNumber: profile.phone_number,
        email: profile.email,
        isVerified: true,
        stationId,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };

      if (verifyData.session) {
        login(updatedUser, verifyData.session.access_token);
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        login(updatedUser, sessionData.session?.access_token || '');
      }

      Alert.alert('Success', 'Account verified and password updated successfully!');
      router.replace('/(attendant)/dashboard');
    } catch (err: any) {
      console.error('Verification submit error:', err);
      Alert.alert('Verification Failed', err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Card style={styles.card}>
            <Text style={styles.title}>Confirm Email & Reset Password</Text>
            <Text style={styles.subtitle}>
              Please enter the 8-digit verification code sent to {email} and choose a new secure password.
            </Text>

            <Text style={styles.otpLabel}>Verification Code</Text>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New Password"
                  placeholder="••••••••"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm New Password"
                  placeholder="••••••••"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  autoCapitalize="none"
                />
              )}
            />

            <Button
              title="Verify & Reset Password"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity onPress={sendOTP} style={styles.resendContainer}>
              <Text style={styles.resendText}>Resend verification code</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  otpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3A3A3C',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 4,
  },
  otpInput: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  button: {
    marginTop: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
