import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore, useBeneficiaryStore, useCustomerStore, useAttendantStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { UserRole, TransactionMode } from '../../types';
import { Loading } from '../../components/ui/Loading';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.USER;

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { transactions: beneficiaryTransactions, fetchTransactions: fetchBeneficiaryTransactions } =
    useBeneficiaryStore();
  const { transactions: customerTransactions, fetchTransactions: fetchCustomerTransactions } =
    useCustomerStore();
  const { recentTransactions, fetchRecentTransactions } = useAttendantStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    if (user?.role === UserRole.USER && user.isBeneficiary) {
      await fetchBeneficiaryTransactions();
      setTransactions(beneficiaryTransactions);
    } else if (user?.role === UserRole.USER && !user.isBeneficiary) {
      await fetchCustomerTransactions();
      setTransactions(customerTransactions);
    } else if (user?.role === UserRole.ATTENDANT) {
      await fetchRecentTransactions();
      setTransactions(recentTransactions);
    }
    setLoading(false);
  };

  if (loading) {
    return <Loading />;
  }

  const renderTransaction = ({ item }: { item: any }) => {
    const isSubsidy = item.mode === TransactionMode.SUBSIDY;

    return (
      <Card style={styles.transactionCard}>
        <View style={styles.transactionContent}>
          <View
            style={[
              styles.transactionIconContainer,
              { backgroundColor: isSubsidy ? '#E3F2FD' : '#F2F2F7' },
            ]}
          >
            <Ionicons
              name={isSubsidy ? 'gift' : item.fuelType === 'PETROL' ? 'flame' : 'water'}
              size={24}
              color={isSubsidy ? theme.primary : item.fuelType === 'PETROL' ? '#FF9500' : theme.primary}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionStation}>
              {item.stationName || 'Fuel Station'}
            </Text>
            <Text style={styles.transactionDetails}>
              {item.liters.toFixed(2)}L • {item.fuelType}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDateTime(item.createdAt)}
            </Text>
          </View>
          <View style={styles.transactionAmountContainer}>
            <Text style={styles.transactionAmount}>
              {formatCurrency(item.amount)}
            </Text>
            <View
              style={[
                styles.statusBadge,
                item.status === 'SUCCESS' ? styles.statusSuccess : styles.statusPending,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: item.status === 'SUCCESS' ? theme.secondary : '#FF9500' },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => Alert.alert('Filter', 'Filter options coming soon')}
        >
          <Ionicons name="options-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>
      
      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: '#FFFFFF' }]}>
            <Ionicons name="receipt-outline" size={64} color="#C7C7CC" />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Your transaction history will appear here once you make a purchase.</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadTransactions}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

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
    paddingTop: 20,
    paddingBottom: 20,
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  filterButton: {
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  transactionCard: {
    marginBottom: 16,
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
  transactionDate: {
    fontSize: 12,
    color: '#C7C7CC',
    fontWeight: '600',
    marginTop: 4,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusSuccess: {
    backgroundColor: '#E3F2FD',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});
