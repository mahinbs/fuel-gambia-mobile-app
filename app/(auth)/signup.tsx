import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../../types';
import { Storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/constants';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function SignupScreen() {
  const router = useRouter();

  const handleRoleSelect = (role: UserRole) => {
    Storage.set(STORAGE_KEYS.SELECTED_ROLE, role);
    // Navigate directly to signup form (separate from login)
    router.push({
      pathname: '/(auth)/signup-form',
      params: { role },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Fuel Gambia</Text>
          <Text style={styles.subtitle}>
            Choose your account type to get started
          </Text>
        </View>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect(UserRole.USER)}
            activeOpacity={0.7}
          >
            <Card style={styles.card}>
              <View style={styles.iconContainer}>
                <Ionicons name="person" size={48} color="#007AFF" />
              </View>
              <Text style={styles.roleTitle}>User</Text>
              <Text style={styles.roleSubtitle}>
                Purchase fuel and manage your transactions
              </Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect(UserRole.ATTENDANT)}
            activeOpacity={0.7}
          >
            <Card style={styles.card}>
              <View style={styles.iconContainer}>
                <Ionicons name="storefront" size={48} color="#007AFF" />
              </View>
              <Text style={styles.roleTitle}>Pump Attendant</Text>
              <Text style={styles.roleSubtitle}>
                Station Staff - Scan QR codes and dispense fuel
              </Text>
            </Card>
          </TouchableOpacity>
        </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  roleContainer: {
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    marginBottom: 8,
  },
  card: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
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
