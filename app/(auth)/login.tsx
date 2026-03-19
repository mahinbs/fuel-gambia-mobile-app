import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { Storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/constants';
import { useAuthStore } from '../../store';
const loginSchema = z.object({
  phone: z.string().min(7, 'Invalid phone number'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fromSignup?: string }>();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const result = await authService.sendOTP(data.phone);
      if (result.success) {
        // Pass through fromSignup parameter if coming from signup flow
        const otpParams: any = { phone: data.phone };
        if (params.fromSignup === 'true') {
          otpParams.fromSignup = 'true';
        }
        router.push({
          pathname: '/(auth)/otp',
          params: otpParams,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
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
          <View style={styles.header}>
            <Text style={styles.title}>Fuel Gambia</Text>
            <Text style={styles.subtitle}>
              Sign in to manage your fuel allocation or purchase fuel.
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="+220 XXX XXXX"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              )}
            />

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Fuel Gambia?</Text>
            <Button
              title="Register as User"
              onPress={() => router.push({
                pathname: '/(auth)/signup-form',
                params: { role: 'USER' }
              })}
              variant="outline"
              style={styles.registerButton}
            />
          </View>

          <View style={styles.testSection}>
            <View style={styles.testDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.testDividerText}>DEBUG / TEST TOOLS</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.testButtons}>
              <Button
                title="Login as Beneficiary"
                onPress={() => handleTestLogin('BENEFICIARY')}
                variant="outline"
                style={styles.testButton}
                textStyle={{ fontSize: 13 }}
              />
              <Button
                title="Login as Attendant"
                onPress={() => handleTestLogin('ATTENDANT')}
                variant="outline"
                style={styles.testButton}
                textStyle={{ fontSize: 13 }}
              />
            </View>
            <Text style={styles.attendantNote}>
              Pump attendants do not need to register. Use shortcuts above to test flows.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  async function handleTestLogin(role: 'USER' | 'BENEFICIARY' | 'ATTENDANT') {
    setLoading(true);
    try {
      const mockPhone = role === 'ATTENDANT' ? '+220 999 8877' : '+220 777 6655';
      const isBeneficiary = role === 'BENEFICIARY';
      const actualRole = role === 'ATTENDANT' ? 'ATTENDANT' : 'USER';
      
      // Store mock signup data
      Storage.set('signup_data', {
        name: role === 'BENEFICIARY' ? 'Almamy Toure' : role === 'ATTENDANT' ? 'Bakary Jatta' : 'Ebrima Sowe',
        phone: mockPhone,
        isBeneficiary,
        stationId: role === 'ATTENDANT' ? 'ST001' : undefined,
        stationName: role === 'ATTENDANT' ? 'Banjul Central Station' : undefined,
      });
      Storage.set(STORAGE_KEYS.SELECTED_ROLE, actualRole);
      
      // Ensure beneficiary is approved for test flow
      if (role === 'BENEFICIARY') {
        Storage.set('beneficiary_docs_uploaded', true);
        Storage.set('beneficiary_verification_status', 'APPROVED');
        Storage.set('mock_beneficiary_data', {
            monthlyAllocation: 5000,
            remainingBalance: Storage.get<number>('mock_beneficiary_balance') || 5000,
            lastAllocationDate: new Date().toISOString(),
        });
      }

      // Directly verify OTP (simulated)
      const auth = await authService.verifyOTP(mockPhone, '123456');
      if (auth) {
        useAuthStore.getState().login(auth.user, auth.token);
        
        // Navigate based on role
        if (actualRole === 'ATTENDANT') {
          router.replace('/(attendant)/dashboard');
        } else {
          router.replace('/(customer)/dashboard');
        }
      }
    } catch (error) {
      console.error('Test login error:', error);
    } finally {
      setLoading(false);
    }
  }
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
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  form: {
    marginBottom: 32,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  registerButton: {
    width: '100%',
    marginBottom: 8,
  },
  attendantNote: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  testSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  testDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  testDividerText: {
    paddingHorizontal: 12,
    fontSize: 10,
    fontWeight: '700',
    color: '#C7C7CC',
    letterSpacing: 1.5,
  },
  testButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  testButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderColor: '#E5E5EA',
  },
});
