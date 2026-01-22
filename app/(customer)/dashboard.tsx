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
import { useCustomerStore, useAuthStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLOR_THEMES } from '../../utils/constants';

const { width } = Dimensions.get('window');
// Use the same color theme as attendant dashboard
const theme = COLOR_THEMES.ATTENDANT;

export default function CustomerDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { transactions, fetchTransactions, getPendingQRCodes } = useCustomerStore();

  useEffect(() => {
    fetchTransactions();
  }, []);

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
              <Text style={styles.greeting}>Welcome back!</Text>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/(customer)/profile')}
            >
              <Ionicons name="person-circle" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/(customer)/purchase')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionGradient, { backgroundColor: theme.secondary }]}>
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionIconContainer}>
                  <Ionicons name="car-sport" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.quickActionText}>
                  <Text style={styles.quickActionTitle}>Buy Fuel</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Purchase fuel now
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIconGradient, { backgroundColor: theme.primary }]}>
                <Ionicons name="cash" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>{formatCurrency(totalSpent)}</Text>
            <View style={styles.statTrend}>
              <Ionicons name="trending-up" size={16} color={theme.primary} />
              <Text style={styles.statTrendText}>This month</Text>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIconGradient, { backgroundColor: theme.secondary }]}>
                <Ionicons name="water" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.statLabel}>Total Liters</Text>
            <Text style={styles.statValue}>{totalLiters.toFixed(1)}L</Text>
            <View style={styles.statTrend}>
              <Ionicons name="flame" size={16} color="#FF9500" />
              <Text style={styles.statTrendText}>All time</Text>
            </View>
          </Card>
        </View>

        {/* QR Code Status Cards */}
        {getPendingQRCodes().length > 0 && (
          <View style={styles.qrStatusSection}>
            <Text style={styles.sectionTitle}>Pending QR Codes</Text>
            {getPendingQRCodes().slice(0, 3).map((qrCode) => (
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
                    <View style={[styles.qrStatusIconContainer, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="qr-code" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.qrStatusInfo}>
                      <Text style={styles.qrStatusTitle}>Paid Fuel QR</Text>
                      <Text style={styles.qrStatusDetails}>
                        {formatCurrency(qrCode.payload.paidAmount || 0)} • {qrCode.payload.fuelType}
                      </Text>
                      <Text style={styles.qrStatusDate}>
                        Created {formatDate(qrCode.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.qrStatusBadge}>
                      <View style={[styles.qrStatusDot, { backgroundColor: '#FF9500' }]} />
                      <Text style={styles.qrStatusText}>Pending</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(customer)/transactions')}
              >
                <Text style={[styles.seeAllText, { color: theme.primary }]}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction, index) => (
                <Card key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionContent}>
                    <View
                      style={[
                        styles.transactionIconContainer,
                        {
                          backgroundColor:
                            transaction.fuelType === 'PETROL'
                              ? '#FFF4E6'
                              : '#E3F2FD',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          transaction.fuelType === 'PETROL' ? 'flame' : 'water'
                        }
                        size={24}
                        color={
                          transaction.fuelType === 'PETROL'
                            ? '#FF9500'
                            : theme.primary
                        }
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionStation}>
                        {transaction.stationName || 'Fuel Station'}
                      </Text>
                      <Text style={styles.transactionDetails}>
                        {transaction.fuelType} • {transaction.liters.toFixed(2)}L
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.transactionAmountContainer}>
                      <Text style={styles.transactionAmount}>
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              transaction.status === 'SUCCESS'
                                ? '#E3F2FD'
                                : '#FFF3E0',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                transaction.status === 'SUCCESS'
                                  ? theme.secondary
                                  : '#FF9500',
                            },
                          ]}
                        >
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Start by purchasing your first fuel
              </Text>
            </Card>
          )}
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinksContainer}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(customer)/transactions')}
          >
            <Ionicons name="receipt" size={24} color={theme.primary} />
            <Text style={[styles.quickLinkText, { color: theme.primary }]}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(customer)/qr-code')}
          >
            <Ionicons name="qr-code" size={24} color={theme.primary} />
            <Text style={[styles.quickLinkText, { color: theme.primary }]}>QR Code</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(customer)/notifications')}
          >
            <Ionicons name="notifications" size={24} color={theme.primary} />
            <Text style={styles.quickLinkText}>Notifications</Text>
          </TouchableOpacity>
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
    paddingBottom: 20,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  quickActionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickActionGradient: {
    padding: 20,
    borderRadius: 20,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statTrendText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    padding: 16,
    borderRadius: 16,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionStation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  transactionDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  quickLinksContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  quickLink: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  qrStatusSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  qrStatusCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
  },
  qrStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrStatusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  qrStatusInfo: {
    flex: 1,
  },
  qrStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  qrStatusDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  qrStatusDate: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  qrStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    gap: 6,
  },
  qrStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  qrStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
});
