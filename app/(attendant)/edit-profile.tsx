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
import { useAuthStore } from '../../store';
import { supabase } from '../../utils/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.ATTENDANT;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone_number: phone.trim() || null,
        })
        .eq('id', user?.id);

      if (error) throw error;

      if (user) {
        setUser({
          ...user,
          name: name.trim(),
          phoneNumber: phone.trim(),
        });
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error('Update profile error:', err);
      Alert.alert('Error', err.message || 'Failed to update profile.');
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
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="Phone Number"
            placeholder="+220 XXXXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label="Email Address"
            value={user?.email || ''}
            editable={false}
            style={{ opacity: 0.6 }}
          />

          <Button
            title="Save Changes"
            onPress={handleSave}
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
