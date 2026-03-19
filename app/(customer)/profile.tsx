import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { userService } from '../../services/userService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatPhoneNumber } from '../../utils/format';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.USER;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      // Navigate to auth screen after logout
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.primary + '15' }]}>
            <View style={[styles.avatarInner, { backgroundColor: theme.primary }]}>
              <Ionicons name="person" size={60} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.phone}>{user && formatPhoneNumber(user.phoneNumber)}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.secondary + '20' }]}>
            <Text style={[styles.role, { color: theme.secondary }]}>
              {user?.isBeneficiary ? 'BENEFICIARY' : 'NORMAL USER'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beneficiary Services</Text>
          <Card style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(customer)/my-coupons')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="ticket-outline" size={22} color={theme.primary} />
              </View>
              <Text style={styles.menuText}>My Fuel Coupons</Text>
              <View style={styles.menuRight}>
                <Text style={styles.balanceText}>{user?.isBeneficiary && 'View Balance'}</Text>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <Card style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Edit Profile', 'Profile editing is coming soon.')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="person-outline" size={22} color={theme.primary} />
              </View>
              <Text style={styles.menuText}>Personal Information</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Payment Methods', 'Manage your payment methods coming soon.')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="card-outline" size={22} color={theme.primary} />
              </View>
              <Text style={styles.menuText}>Payment Methods</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Security', 'Security settings coming soon.')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color={theme.primary} />
              </View>
              <Text style={styles.menuText}>Security & Privacy</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Card style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Notifications', 'Notification settings coming soon.')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="notifications-outline" size={22} color={theme.primary} />
              </View>
              <Text style={styles.menuText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Language', 'Language settings coming soon.')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="globe-outline" size={22} color={theme.primary} />
              </View>
              <Text style={styles.menuText}>Language</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Help Center', 'Help Center coming soon.')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="help-circle-outline" size={22} color={theme.primary} />
              </View>
              <Text style={styles.menuText}>Help Center</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('About', 'Fuel Gambia v1.0.0')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="information-circle-outline" size={22} color={theme.primary} />
              </View>
              <Text style={styles.menuText}>About App</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </Card>
        </View>

        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="danger"
          loading={loading}
          style={styles.logoutButton}
        />

        <Text style={styles.versionText}>Version 1.0.0 (Build 100)</Text>
        <View style={{ height: 40 }} />
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
    paddingBottom: 40,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  role: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 24,
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceText: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 16,
    height: 56,
    borderRadius: 16,
  },
  versionText: {
    textAlign: 'center',
    color: '#C7C7CC',
    fontSize: 12,
    marginTop: 24,
    fontWeight: '600',
  },
});
