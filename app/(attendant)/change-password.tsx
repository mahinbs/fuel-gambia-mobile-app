import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.ATTENDANT;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async () => {
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      Alert.alert('Success', 'Password changed successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error('Change password error:', err);
      Alert.alert('Error', err.message || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Change Password</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="New Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          <Input
            label="Confirm New Password"
            placeholder="••••••••"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
          />

          <Button
            title="Update Password"
            onPress={handleChangePassword}
            loading={submitting}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    gap: 16,
  },
  saveButton: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.primary,
  },
});
