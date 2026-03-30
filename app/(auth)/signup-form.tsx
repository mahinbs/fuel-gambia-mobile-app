import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { UserRole } from '../../types';
import { Storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/constants';
import { authService } from '../../services/authService';

const userSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address is required'),
  sex: z.enum(['Male', 'Female', 'Other']),
  idImage: z.string().min(1, 'ID Upload is required for KYC'),
  useCoupon: z.boolean().default(false),
  isBeneficiary: z.boolean().default(false),
  institutionCode: z.string().optional(),
  paymentMethods: z.array(z.string()).min(1, 'Select at least one payment method'),
}).refine(data => !data.useCoupon || (data.useCoupon && data.institutionCode && data.institutionCode.length > 0), {
  message: "Institution code is required when using a coupon",
  path: ["institutionCode"]
});

const attendantSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address is required'),
  sex: z.enum(['Male', 'Female', 'Other']),
  idImage: z.string().min(1, 'ID Upload is required for KYC'),
  stationId: z.string().min(1, 'Station ID is required'),
  stationName: z.string().min(1, 'Station name is required'),
});

type UserSignupFormData = z.infer<typeof userSignupSchema>;
type AttendantSignupFormData = z.infer<typeof attendantSignupSchema>;

export default function SignupFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role: string }>();
  const role = (params.role as UserRole) || UserRole.USER;
  const [loading, setLoading] = useState(false);
  const isAttendant = role === UserRole.ATTENDANT;

  const userForm = useForm<UserSignupFormData>({
    resolver: zodResolver(userSignupSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: '',
      address: '',
      sex: 'Male',
      idImage: '',
      useCoupon: false,
      isBeneficiary: false,
      institutionCode: '',
      paymentMethods: [],
    },
  });

  const attendantForm = useForm<AttendantSignupFormData>({
    resolver: zodResolver(attendantSignupSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: '',
      address: '',
      sex: 'Male',
      idImage: '',
      stationId: '',
      stationName: '',
    },
  });

  const onSubmit = async (data: UserSignupFormData | AttendantSignupFormData) => {
    setLoading(true);
    try {
      // Store signup data
      Storage.set(STORAGE_KEYS.SELECTED_ROLE, role);
      Storage.set('signup_data', data);

      // Send OTP for verification
      const result = await authService.sendOTP(data.email);
      if (result.success) {
        router.push({
          pathname: '/(auth)/otp',
          params: {
            email: data.email,
            fromSignup: 'true',
            role,
          },
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const form = isAttendant ? attendantForm : userForm;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isAttendant ? 'Pump Attendant Signup' : 'User Signup'}
            </Text>
            <Text style={styles.subtitle}>
              Fill in your information to create an account
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Controller
              control={form.control as any}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={(form.formState.errors as any).name?.message}
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={form.control as any}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="+2201234567"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={(form.formState.errors as any).phoneNumber?.message}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={form.control as any}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="your.email@example.com"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={(form.formState.errors as any).email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={form.control as any}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Address"
                  placeholder="Enter your address"
                  value={(value as string) || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={(form.formState.errors as any).address?.message}
                />
              )}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Controller
                  control={form.control as any}
                  name="idImage"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TouchableOpacity 
                      style={[styles.uploadButton, (form.formState.errors as any).idImage && styles.uploadButtonError]}
                      onPress={() => onChange('mock_id_image_url')}
                    >
                      <Ionicons name="camera" size={20} color={value ? "#34C759" : "#8E8E93"} />
                      <Text style={styles.uploadButtonText}>
                        {value ? 'ID Uploaded' : 'Upload ID'}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                {(form.formState.errors as any).idImage && (
                  <p className="text-xs text-rose-500 mt-1">ID Upload is required</p>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fieldLabel}>Sex</Text>
                <View style={styles.sexContainer}>
                  {['Male', 'Female'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.sexOption,
                          (form.watch as any)('sex') === option && styles.sexOptionActive,
                        ]}
                        onPress={() => (form.setValue as any)('sex', option)}
                      >
                      <Text style={[
                        styles.sexOptionText,
                        (form.watch as any)('sex') === option && styles.sexOptionTextActive
                      ]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {role === UserRole.USER && (
              <>
                <View style={styles.couponToggleContainer}>
                  <Text style={styles.fieldLabel}>Do you use a coupon?</Text>
                  <TouchableOpacity
                    style={[styles.toggle, (form.watch as any)('useCoupon') && styles.toggleActive]}
                    onPress={() => (form.setValue as any)('useCoupon', !(form.watch as any)('useCoupon'))}
                  >
                    <View style={[styles.toggleDot, (form.watch as any)('useCoupon') && styles.toggleDotActive]} />
                  </TouchableOpacity>
                </View>

                {(form.watch as any)('useCoupon') && (
                  <>
                    <View style={styles.couponToggleContainer}>
                      <Text style={styles.fieldLabel}>Are you a beneficiary?</Text>
                      <TouchableOpacity
                        style={[styles.toggle, (form.watch as any)('isBeneficiary') && styles.toggleActive]}
                        onPress={() => (form.setValue as any)('isBeneficiary', !(form.watch as any)('isBeneficiary'))}
                      >
                        <View style={[styles.toggleDot, (form.watch as any)('isBeneficiary') && styles.toggleDotActive]} />
                      </TouchableOpacity>
                    </View>

                    <Controller
                      control={form.control as any}
                      name="institutionCode"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          label="Institution Code"
                          placeholder="Enter your institution's code"
                          value={(value as string) || ''}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={(form.formState.errors as any).institutionCode?.message}
                          autoCapitalize="characters"
                        />
                      )}
                    />
                  </>
                )}

                <Text style={styles.fieldLabel}>Payment Methods (Select multiple)</Text>
                <View style={styles.paymentMethodsContainer}>
                  {['Bank Account', 'Wallet', 'Credit Card', 'Cash'].map((method) => {
                    const selectedMethods = ((form.watch as any)('paymentMethods')) || [];
                    const isSelected = selectedMethods.includes(method);
                    return (
                      <TouchableOpacity
                        key={method}
                        style={[styles.paymentMethodCard, isSelected && styles.paymentMethodCardActive]}
                        onPress={() => {
                          if (isSelected) {
                            (form.setValue as any)('paymentMethods', selectedMethods.filter((m: string) => m !== method));
                          } else {
                            (form.setValue as any)('paymentMethods', [...selectedMethods, method]);
                          }
                        }}
                      >
                        <Ionicons 
                          name={isSelected ? "checkbox" : "square-outline"} 
                          size={20} 
                          color={isSelected ? "#007AFF" : "#8E8E93"} 
                        />
                        <Text style={[styles.paymentMethodText, isSelected && styles.paymentMethodTextActive]}>{method}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {isAttendant && (
              <>
                <Controller
                  control={attendantForm.control}
                  name="stationId"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Station ID"
                      placeholder="Enter station ID"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={attendantForm.formState.errors.stationId?.message}
                      autoCapitalize="none"
                    />
                  )}
                />

                <Controller
                  control={attendantForm.control}
                  name="stationName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Station Name"
                      placeholder="Enter station name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={attendantForm.formState.errors.stationName?.message}
                      autoCapitalize="words"
                    />
                  )}
                />
              </>
            )}

            <Button
              title="Register"
              onPress={form.handleSubmit(onSubmit)}
              loading={loading}
              style={styles.submitButton}
            />
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Button
              title="Login"
              onPress={() => router.push('/(auth)/login')}
              variant="outline"
              size="medium"
            />
          </View>
        </ScrollView>
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
  scrollContent: {
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  formCard: {
    padding: 20,
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  sexContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sexOption: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  sexOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  sexOptionText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  sexOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  couponToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#34C759',
  },
  toggleDot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleDotActive: {
    transform: [{ translateX: 20 }],
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  paymentMethodCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  paymentMethodTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  uploadButton: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 8,
    marginTop: 22,
  },
  uploadButtonError: {
    borderColor: '#FF3B30',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
});
