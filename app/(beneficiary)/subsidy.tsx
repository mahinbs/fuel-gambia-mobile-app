import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useBeneficiaryStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { UserRole } from '../../types';
import { formatDate } from '../../utils/format';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.BENEFICIARY;

export default function SubsidyScreen() {
  const { user } = useAuthStore();
  const { beneficiary, fetchBeneficiary, fetchTransactions, isLoading } = useBeneficiaryStore();

  useFocusEffect(
    React.useCallback(() => {
      fetchBeneficiary();
      fetchTransactions();
    }, [])
  );

  if (isLoading && !beneficiary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="gift-outline" size={64} color={theme.primary} />
          <Text style={styles.emptyTitle}>Loading Subsidy Info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || user.role !== UserRole.USER || !beneficiary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.emptyTitle}>Access Denied</Text>
          <Text style={styles.emptyText}>This page is only available to registered beneficiaries.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalUsed = Math.max(0, beneficiary.monthlyAllocation - beneficiary.remainingBalance);
  const usePercentage = beneficiary.monthlyAllocation > 0 
    ? (totalUsed / beneficiary.monthlyAllocation) * 100 
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="gift" size={32} color={theme.primary} />
          <Text style={styles.title}>Government Fuel Subsidy</Text>
          <Text style={styles.subtitle}>View your allocated quota and remaining fuel</Text>
        </View>

        {/* Quota Progress Card */}
        <Card style={styles.quotaCard}>
          <View style={styles.quotaRow}>
            <View>
              <Text style={styles.quotaLabel}>Remaining Balance</Text>
              <Text style={styles.quotaValue}>{beneficiary.remainingBalance.toFixed(1)} L</Text>
            </View>
            <View style={styles.quotaIconBadge}>
              <Ionicons name="leaf" size={28} color="#34C759" />
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${100 - usePercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {((beneficiary.remainingBalance / beneficiary.monthlyAllocation) * 100).toFixed(0)}% remaining
            </Text>
          </View>
        </Card>

        {/* Liters Details Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Monthly Allocation</Text>
            <Text style={styles.infoValue}>{beneficiary.monthlyAllocation} L</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Used (This Month)</Text>
            <Text style={[styles.infoValue, { color: '#FF3B30' }]}>{totalUsed.toFixed(1)} L</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Remaining Quota</Text>
            <Text style={[styles.infoValue, { color: '#34C759' }]}>{beneficiary.remainingBalance} L</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Department</Text>
            <Text style={styles.infoValue}>{beneficiary.departmentName || 'Not Assigned'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Government ID</Text>
            <Text style={styles.infoValue}>{beneficiary.governmentId || 'Not Set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fuel Type</Text>
            <Text style={styles.infoValue}>{beneficiary.fuelType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expiry Date</Text>
            <Text style={styles.infoValue}>{formatDate(beneficiary.expiryDate)}</Text>
          </View>
        </Card>

        {/* Instructions Card */}
        <Card style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How it works</Text>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>Tap on **Buy Fuel** from the dashboard home page and select your fuel type.</Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>Select **Allocated Fuel Quota (Liters)** as the payment method, enter the liters, and generate your QR code.</Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepText}>Present the generated QR code to any station attendant. Once scanned and dispensed, your remaining balance updates here.</Text>
          </View>
        </Card>
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
    marginBottom: 24,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginTop: 12,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  quotaCard: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quotaLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  quotaValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000000',
  },
  quotaIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  infoCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  instructionsCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#48484A',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 450,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
});
