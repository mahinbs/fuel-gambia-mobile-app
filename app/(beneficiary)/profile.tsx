import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { userService } from '../../services/userService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatPhoneNumber } from '../../utils/format';
import { COLOR_THEMES } from '../../utils/constants';
import { supabase } from '../../utils/supabase';

const theme = COLOR_THEMES.BENEFICIARY;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [subView, setSubView] = useState<'main' | 'edit' | 'password' | 'notifications' | 'support'>('main');

  // Edit Profile fields
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  // Change Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification Settings toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [txnEnabled, setTxnEnabled] = useState(true);
  const [quotaEnabled, setQuotaEnabled] = useState(true);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Full name cannot be empty');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const updated = await userService.updateProfile(user.id, {
        name: editName,
        email: editEmail,
      });

      if (updated) {
        // Sync zustand store state
        setUser({
          ...user,
          name: editName,
          email: editEmail,
        });
        Alert.alert('Success', 'Profile updated successfully!');
        setSubView('main');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert('Success', 'Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setSubView('main');
    } catch (error: any) {
      console.error('Password change error:', error);
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (subView === 'edit') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setSubView('main')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.subTitle}>Edit Profile</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.formCard}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={editName}
              onChangeText={setEditName}
            />
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Phone Number (Read-only)"
              value={user?.phoneNumber || ''}
              editable={false}
              style={{ backgroundColor: '#E5E5EA', color: '#8E8E93' }}
            />
          </Card>
          <Button
            title="Save Changes"
            onPress={handleUpdateProfile}
            loading={loading}
            style={styles.saveButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (subView === 'password') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setSubView('main')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.subTitle}>Change Password</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.formCard}>
            <Input
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Input
              label="Confirm New Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </Card>
          <Button
            title="Update Password"
            onPress={handleUpdatePassword}
            loading={loading}
            style={styles.saveButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (subView === 'notifications') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setSubView('main')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.subTitle}>Notification Settings</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Push Notifications</Text>
                <Text style={styles.toggleDesc}>Receive alerts on your device lock screen</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ true: theme.primary }}
              />
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Email Notifications</Text>
                <Text style={styles.toggleDesc}>Receive transaction summaries via email</Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ true: theme.primary }}
              />
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Transaction Alerts</Text>
                <Text style={styles.toggleDesc}>Get notified immediately after fuel is dispensed</Text>
              </View>
              <Switch
                value={txnEnabled}
                onValueChange={setTxnEnabled}
                trackColor={{ true: theme.primary }}
              />
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Quota Treshold Alerts</Text>
                <Text style={styles.toggleDesc}>Receive notifications when remaining liters are low</Text>
              </View>
              <Switch
                value={quotaEnabled}
                onValueChange={setQuotaEnabled}
                trackColor={{ true: theme.primary }}
              />
            </View>
          </Card>
          <Button
            title="Save Settings"
            onPress={() => {
              Alert.alert('Success', 'Notification settings saved.');
              setSubView('main');
            }}
            style={styles.saveButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (subView === 'support') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setSubView('main')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.subTitle}>Help & FAQ</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>
          
          <Card style={styles.faqCard}>
            <Text style={styles.faqQuestion}>How do I purchase fuel using my allocation?</Text>
            <Text style={styles.faqAnswer}>
              Go to Buy Fuel, select "Allocated Fuel Quota (Liters)", input the number of liters, and click Generate QR.
            </Text>
          </Card>

          <Card style={styles.faqCard}>
            <Text style={styles.faqQuestion}>How does the attendant scan my QR code?</Text>
            <Text style={styles.faqAnswer}>
              Show the generated QR code page to the pump attendant. They will scan it with their camera scanner to confirm liters and department before dispensing.
            </Text>
          </Card>

          <Card style={styles.faqCard}>
            <Text style={styles.faqQuestion}>What if my QR code is showing as invalid?</Text>
            <Text style={styles.faqAnswer}>
              Make sure the QR has not already been used or expired. If a transaction is scanned once, it is marked done and becomes invalid.
            </Text>
          </Card>

          <Text style={styles.sectionHeader}>Contact Support</Text>
          <Card style={styles.formCard}>
            <View style={styles.supportRow}>
              <Ionicons name="mail-outline" size={24} color={theme.primary} />
              <Text style={styles.supportText}>support@fuelgambia.com</Text>
            </View>
            <View style={styles.supportRow}>
              <Ionicons name="call-outline" size={24} color={theme.primary} />
              <Text style={styles.supportText}>+220 123 4567</Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.secondary + '20' }]}>
            <Ionicons name="person-circle" size={80} color={theme.primary} />
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.phone}>{user && formatPhoneNumber(user.phoneNumber)}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.secondary + '20' }]}>
            <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
            <Text style={[styles.role, { color: theme.primary }]}>Fuel Beneficiary</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setSubView('edit')}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.secondary + '20' }]}>
              <Ionicons name="person-outline" size={24} color={theme.primary} />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setSubView('password')}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.secondary + '20' }]}>
              <Ionicons name="lock-closed-outline" size={24} color={theme.primary} />
            </View>
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setSubView('notifications')}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.secondary + '20' }]}>
              <Ionicons name="notifications-outline" size={24} color={theme.primary} />
            </View>
            <Text style={styles.menuText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setSubView('support')}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.secondary + '20' }]}>
              <Ionicons name="help-circle-outline" size={24} color={theme.primary} />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </Card>

        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          loading={loading}
          style={styles.logoutButton}
        />
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
    marginBottom: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  card: {
    marginBottom: 24,
    padding: 4,
    backgroundColor: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    marginLeft: 16,
  },
  logoutButton: {
    marginTop: 16,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  formCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  saveButton: {
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  toggleDesc: {
    fontSize: 12,
    color: '#8E8E93',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginTop: 12,
    marginBottom: 16,
  },
  faqCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  supportText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
