import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCustomerStore, useAuthStore, useBeneficiaryStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLOR_THEMES, FUEL_PRICES } from '../../utils/constants';

const { width } = Dimensions.get('window');
// Use the same color theme as attendant dashboard
const theme = COLOR_THEMES.ATTENDANT;

export default function CustomerDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { transactions, fetchTransactions, getPendingQRCodes } = useCustomerStore();
  const { beneficiary, fetchBeneficiary } = useBeneficiaryStore();

  useEffect(() => {
    fetchTransactions();
    if (user?.isBeneficiary) {
      fetchBeneficiary();
    }
  }, [user]);

  const recentTransactions = transactions.slice(0, 3);
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalLiters = transactions.reduce((sum, t) => sum + t.liters, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <View style={[styles.headerGradient, { backgroundColor: theme.primary }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Good day,</Text>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/(customer)/profile')}
            >
              <View style={styles.avatarBorder}>
                <Ionicons name="person" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Beneficiary Balance Card */}
        {user?.isBeneficiary && (
          <View style={styles.beneficiaryBalanceSection}>
            <TouchableOpacity
              onPress={() => router.push('/(customer)/my-coupons')}
              activeOpacity={0.9}
            >
              <Card style={styles.balanceCard}>
                <View style={styles.balanceHeader}>
                  <View style={styles.balanceIconContainer}>
                    <Ionicons name="ticket" size={24} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.balanceLabel}>Fuel Coupon Balance</Text>
                    <Text style={styles.balanceAmount}>
                      {formatCurrency(beneficiary?.remainingBalance || 0)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#C7C7CC" style={{ marginLeft: 'auto' }} />
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={[styles.quickActionsContainer, { marginTop: user?.isBeneficiary ? 0 : -20 }]}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/(customer)/purchase')}
            activeOpacity={0.9}
          >
            <View style={[styles.quickActionGradient, { backgroundColor: theme.secondary }]}>
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionIconContainer}>
                  <Ionicons name="speedometer-outline" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.quickActionText}>
                  <Text style={styles.quickActionTitle}>Purchase Fuel</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Quickly top up your tank
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={32} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* QR Code Status Cards */}
        {getPendingQRCodes().length > 0 && (
          <View style={styles.qrStatusSection}>
            <Text style={styles.sectionTitle}>Pending Coupons</Text>
            {getPendingQRCodes().slice(0, 2).map((qrCode) => (
              <TouchableOpacity
                key={qrCode.id}
                onPress={() => router.push({
                  pathname: '/(customer)/qr-code',
                  params: { qrId: qrCode.id }
                })}
                activeOpacity={0.7}
              >
                <Card style={styles.qrStatusCard}>
                  <View style={styles.qrStatusContent}>
                    <View style={[styles.qrStatusIconContainer, { backgroundColor: theme.primary + '15' }]}>
                      <Ionicons name="qr-code" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.qrStatusInfo}>
                      <Text style={styles.qrStatusTitle}>{qrCode.payload.fuelType} Coupon</Text>
                      <Text style={styles.qrStatusDetails}>
                        {formatCurrency(qrCode.payload.paidAmount || 0)} • {qrCode.payload.fuelType}
                      </Text>
                    </View>
                    <View style={styles.qrStatusBadge}>
                      <Text style={styles.qrStatusText}>View</Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIconGradient, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="card" size={24} color={theme.primary} />
              </View>
            </View>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>{formatCurrency(totalSpent)}</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIconGradient, { backgroundColor: theme.secondary + '15' }]}>
                <Ionicons name="water" size={24} color={theme.secondary} />
              </View>
            </View>
            <Text style={styles.statLabel}>Total Liters</Text>
            <Text style={styles.statValue}>{totalLiters.toFixed(1)}L</Text>
          </Card>
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel Products</Text>
          <View style={styles.productsGrid}>
            {(['PETROL', 'DIESEL', 'KEROSENE', 'BUTANE'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.productCard}
                onPress={() => router.push({
                  pathname: '/(customer)/purchase',
                  params: { fuelType: type }
                })}
              >
                <Card style={styles.productCardInner} padding={0}>
                  <View style={[styles.productIconContainer, { backgroundColor: type === 'PETROL' ? '#FFF4E6' : '#E3F2FD' }]}>
                    <Ionicons
                      name={type === 'PETROL' ? 'flame' : type === 'DIESEL' ? 'water' : type === 'KEROSENE' ? 'flask' : 'bonfire'}
                      size={28}
                      color={type === 'PETROL' ? '#FF9500' : theme.primary}
                    />
                  </View>
                  <Text style={styles.productName}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </Text>
                  <Text style={styles.productPrice}>
                    {(FUEL_PRICES as any)[type]} GMD/u
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {transactions.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(customer)/transactions')}
              >
                <Text style={[styles.seeAllText, { color: theme.primary }]}>History</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction) => (
                <Card key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionContent}>
                    <View
                      style={[
                        styles.transactionIconContainer,
                        { backgroundColor: '#F2F2F7' },
                      ]}
                    >
                      <Ionicons
                        name={transaction.fuelType === 'PETROL' ? 'flame' : 'water'}
                        size={24}
                        color={transaction.fuelType === 'PETROL' ? '#FF9500' : theme.primary}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionStation}>
                        {transaction.stationName || 'Fuel Station'}
                      </Text>
                      <Text style={styles.transactionDetails}>
                        {transaction.liters.toFixed(2)}L • {transaction.fuelType}
                      </Text>
                    </View>
                    <View style={styles.transactionAmountContainer}>
                      <Text style={styles.transactionAmount}>
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>No orders yet</Text>
            </Card>
          )}
        </View>

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
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileButton: {
    padding: 2,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  beneficiaryBalanceSection: {
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 20,
    zIndex: 1,
  },
  balanceCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  balanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  quickActionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  quickActionGradient: {
    padding: 24,
    borderRadius: 24,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
  },
  statIconContainer: {
    marginBottom: 16,
  },
  statIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    padding: 4,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    marginTop: 20,
  },
  productCard: {
    width: (width - 56) / 2,
  },
  productCardInner: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  productIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '700',
  },
  qrStatusSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  qrStatusCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  qrStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrStatusIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  qrStatusInfo: {
    flex: 1,
  },
  qrStatusTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  qrStatusDetails: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  qrStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  qrStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
  },
  transactionsList: {
    gap: 16,
  },
  transactionCard: {
    padding: 18,
    borderRadius: 24,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionStation: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  transactionDetails: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#C7C7CC',
    fontWeight: '600',
  },
  emptyCard: {
    padding: 60,
    alignItems: 'center',
    borderRadius: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8E8E93',
    marginTop: 20,
  },
});
