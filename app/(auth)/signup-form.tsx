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
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

const attendantSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
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
    },
  });

  const attendantForm = useForm<AttendantSignupFormData>({
    resolver: zodResolver(attendantSignupSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: '',
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
      const result = await authService.sendOTP(data.phoneNumber);
      if (result.success) {
        router.push({
          pathname: '/(auth)/otp',
          params: {
            phoneNumber: data.phoneNumber,
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
              control={form.control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={form.formState.errors.name?.message}
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={form.control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="+2201234567"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={form.formState.errors.phoneNumber?.message}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={form.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email (Optional)"
                  placeholder="your.email@example.com"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={form.formState.errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />

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
              title="Continue"
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
});
