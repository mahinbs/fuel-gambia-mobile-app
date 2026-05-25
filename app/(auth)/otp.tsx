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
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store';
import { Storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/constants';
import { UserRole } from '../../types';

const { width } = Dimensions.get('window');

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; email?: string; role?: string; fromSignup?: string }>();
  const phone = params.phone || '';
  const email = params.email || '';
  const fromSignup = params.fromSignup === 'true';
  const role = params.role || 'USER';
  const numDigits = email ? 8 : 6;

  const { login } = useAuthStore();
  const [otp, setOtp] = useState<string[]>(() => Array(numDigits).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Paste support: strip non-numeric characters and split across the inputs
      const cleanValue = value.replace(/[^0-9]/g, '').slice(0, numDigits);
      if (cleanValue.length > 0) {
        const newOtp = [...otp];
        for (let i = 0; i < numDigits; i++) {
          if (i < cleanValue.length) {
            newOtp[i] = cleanValue[i];
          }
        }
        setOtp(newOtp);
        const focusIndex = Math.min(cleanValue.length, numDigits - 1);
        inputRefs.current[focusIndex]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < numDigits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('').trim();
    if (otpString.length !== numDigits) {
      Alert.alert('Validation Error', `Please enter the complete ${numDigits}-digit verification code.`);
      return;
    }

    setLoading(true);
    try {
      let result;
      if (email) {
        const signupData = Storage.get<any>('signup_data');
        result = await authService.verifyEmailOTP(email, otpString, role, signupData);
      } else {
        result = await authService.verifyOTP(phone, otpString);
      }

      if (result && result.user) {
        login(result.user, result.token);
        Storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
        
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          if (fromSignup) {
            // Signup flow: if user is a beneficiary, go to verification status screen (KYC pending)
            if (result.user.role === UserRole.USER && result.user.isBeneficiary) {
              router.replace('/(beneficiary)/verification-status');
            } else {
              // Regular user or attendant - go to dashboard
              router.replace('/');
            }
          } else {
            // Login flow: go to dashboard
            router.replace('/');
          }
        } catch (navError) {
          console.error('Navigation error:', navError);
          router.replace('/');
        }
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (email) {
        const { error } = await authService.signup(Storage.get<any>('signup_data'));
        if (error) throw new Error(error);
      } else {
        await authService.sendOTP(phone);
      }
      Alert.alert('Success', 'OTP resent successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to resend OTP');
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
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              {email 
                ? `We sent an 8-digit verification code to ${email}`
                : `We sent a 6-digit code to ${phone}`
              }
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  numDigits === 8 ? styles.otpInputSmall : null,
                ]}
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

          <Button
            title="Verify"
            onPress={handleVerify}
            loading={loading}
            style={styles.button}
          />

          <Button
            title="Resend OTP"
            onPress={handleResend}
            variant="outline"
            size="small"
            style={styles.resendButton}
          />
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
    alignItems: 'center',
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
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 5,
    gap: 4,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  otpInputSmall: {
    height: 48,
    fontSize: 18,
    borderRadius: 8,
  },
  button: {
    marginBottom: 16,
  },
  resendButton: {
    marginTop: 8,
  },
});
