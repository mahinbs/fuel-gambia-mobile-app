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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store';
import { Storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/constants';

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phoneNumber: string; fromSignup?: string }>();
  const phoneNumber = params.phoneNumber || '';
  const fromSignup = params.fromSignup === 'true';
  const { login } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return;

    setLoading(true);
    try {
      const result = await authService.verifyOTP(phoneNumber, otpString);
      if (result && result.user) {
        login(result.user, result.token);
        Storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
        
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          if (fromSignup) {
            // Signup flow: if user is USER and beneficiary status is not set, show selection screen
            if (result.user.role === 'USER' && result.user.isBeneficiary === undefined) {
              router.replace({
                pathname: '/(auth)/beneficiary-selection',
                params: { fromSignup: 'true' }
              });
            } else {
              // Attendant or user with beneficiary status already set - go to dashboard
              router.replace('/');
            }
          } else {
            // Login flow: always show beneficiary-selection for USER role if status is undefined
            if (result.user.role === 'USER' && result.user.isBeneficiary === undefined) {
              router.replace('/(auth)/beneficiary-selection');
            } else {
              router.replace('/');
            }
          }
        } catch (navError) {
          console.error('Navigation error:', navError);
          // Fallback to home
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
    await authService.sendOTP(phoneNumber);
    Alert.alert('Success', 'OTP resent successfully');
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
              We sent a 6-digit code to {phoneNumber}
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
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

          <Button
            title="Verify"
            onPress={handleVerify}
            loading={loading}
            disabled={otp.join('').length !== 6}
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
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 48,
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
  button: {
    marginBottom: 16,
  },
  resendButton: {
    marginTop: 8,
  },
});
