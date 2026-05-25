import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store';
import { UserRole } from '../../types';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fromSignup?: string }>();
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const result = await authService.loginWithPassword(data.email, data.password);
      if (result) {
        login(result.user, result.token);

        if (result.user.role === UserRole.ATTENDANT) {
          if (result.user.isVerified === false) {
            router.replace({
              pathname: '/(auth)/attendant-verify',
              params: { email: result.user.email },
            });
            return;
          }
          router.replace('/(attendant)/dashboard');
        } else {
          // Customer or Beneficiary
          router.replace('/');
        }
      } else {
        Alert.alert('Login Failed', 'Invalid credentials or login failed.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message?.toLowerCase().includes('email not confirmed') || error.message?.toLowerCase().includes('email not verified')) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email address to continue.',
          [
            {
              text: 'Verify Now',
              onPress: () => {
                router.replace({
                  pathname: '/(auth)/attendant-verify',
                  params: { email: data.email },
                });
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Login Error', error.message || 'An error occurred during login.');
      }
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
              Sign in with your email and password to access your dashboard.
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="your.email@example.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
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

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Fuel Gambia?</Text>
            <View style={styles.registerButtons}>
              <Button
                title="Register as Normal User"
                onPress={() => router.push({
                  pathname: '/(auth)/signup-form',
                  params: { role: 'USER', isBeneficiary: 'false' }
                })}
                variant="outline"
                style={styles.registerButton}
                textStyle={{ fontSize: 13 }}
              />
              <Button
                title="Register as Beneficiary"
                onPress={() => router.push({
                  pathname: '/(auth)/signup-form',
                  params: { role: 'USER', isBeneficiary: 'true' }
                })}
                variant="outline"
                style={styles.registerButton}
                textStyle={{ fontSize: 13 }}
              />
            </View>
          </View>
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
  registerButtons: {
    width: '100%',
    flexDirection: 'column',
    gap: 10,
  },
  registerButton: {
    width: '100%',
  },
});
