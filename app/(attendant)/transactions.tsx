import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useBeneficiaryStore, useCustomerStore, useAttendantStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { UserRole, TransactionMode } from '../../types';
import { Loading } from '../../components/ui/Loading';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.ATTENDANT;

export default function TransactionHistoryScreen() {
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
          <View style={styles.transactionIcon}>
            <Ionicons
              name={isSubsidy ? 'gift' : 'card'}
              size={24}
              color={isSubsidy ? theme.secondary : theme.primary}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionStation}>
              {item.stationName || 'Fuel Station'}
            </Text>
            <Text style={styles.transactionDetails}>
              {item.fuelType} • {item.liters.toFixed(2)}L • {item.mode}
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
                item.status === 'SUCCESS' && styles.statusSuccess,
              ]}
            >
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
      </View>
      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadTransactions}
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
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  transactionCard: {
    marginBottom: 12,
    padding: 16,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    marginRight: 12,
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
    color: '#8E8E93',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
  },
  statusSuccess: {
    backgroundColor: '#D4EDDA',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
});
