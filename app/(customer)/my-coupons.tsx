import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useBeneficiaryStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.USER;

export default function MyCouponsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { beneficiary, transactions, isLoading, fetchBeneficiary, fetchTransactions } = useBeneficiaryStore();

  useEffect(() => {
    fetchBeneficiary();
    fetchTransactions();
  }, []);

  const onRefresh = () => {
    fetchBeneficiary();
    fetchTransactions();
  };

  const subsidyTransactions = transactions.filter(t => t.mode === 'SUBSIDY');

  if (!user?.isBeneficiary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={theme.primary} />
          <Text style={styles.emptyTitle}>Restricted Access</Text>
          <Text style={styles.emptyText}>
            This feature is only available for registered fuel beneficiaries.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coupons</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Remaining Balance</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ACTIVE</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>
            {formatCurrency(beneficiary?.remainingBalance || 0)}
          </Text>
          <View style={styles.balanceFooter}>
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Monthly Allocation</Text>
              <Text style={styles.footerValue}>
                {formatCurrency(beneficiary?.monthlyAllocation || 0)}
              </Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Expiry Date</Text>
              <Text style={styles.footerValue}>
                {beneficiary?.expiryDate ? formatDate(beneficiary.expiryDate) : 'N/A'}
              </Text>
            </View>
          </View>
        </Card>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Usage History</Text>
          {subsidyTransactions.length > 0 ? (
            subsidyTransactions.map((item) => (
              <Card key={item.id} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <Ionicons name="receipt-outline" size={24} color={theme.primary} />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>{item.fuelType} Fuel Redemption</Text>
                  <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={styles.transactionAmountContainer}>
                  <Text style={styles.transactionAmount}>-{formatCurrency(item.amount)}</Text>
                  <Text style={styles.transactionStatus}>SUCCESS</Text>
                </View>
              </Card>
            ))
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="list-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyHistoryText}>No usage history yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.buyButton}
        onPress={() => router.push('/(customer)/purchase')}
      >
        <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
        <Text style={styles.buyButtonText}>Purchase with Coupon</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: '#34C75920',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34C759',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: theme.primary,
    marginBottom: 24,
  },
  balanceFooter: {
    flexDirection: 'row',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    justifyContent: 'space-between',
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  footerDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#F2F2F7',
    marginHorizontal: 16,
  },
  historySection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3A3A3C',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34C759',
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buyButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
