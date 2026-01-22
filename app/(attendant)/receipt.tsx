import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAttendantStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.ATTENDANT;

export default function ReceiptScreen() {
  const router = useRouter();
  const { scannedQR, clearScannedQR } = useAttendantStore();

  const handleDone = () => {
    clearScannedQR();
    router.push('/(attendant)/dashboard');
  };

  if (!scannedQR) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transaction data</Text>
          <Button title="Go Back" onPress={handleDone} style={styles.backButton} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={64} color={theme.secondary} />
          <Text style={styles.title}>Transaction Complete</Text>
        </View>

        <Card style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>Fuel Gambia</Text>
            <Text style={styles.receiptSubtitle}>Transaction Receipt</Text>
          </View>

          <View style={styles.receiptBody}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Transaction ID</Text>
              <Text style={styles.receiptValue}>
                {scannedQR.mode === 'SUBSIDY'
                  ? (scannedQR as any).couponId
                  : (scannedQR as any).transactionId}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Date</Text>
              <Text style={styles.receiptValue}>
                {formatDateTime(new Date())}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Mode</Text>
              <Text style={styles.receiptValue}>{scannedQR.mode}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Fuel Type</Text>
              <Text style={styles.receiptValue}>{scannedQR.fuelType}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Amount</Text>
              <Text style={styles.receiptValue}>
                {formatCurrency(
                  scannedQR.mode === 'SUBSIDY'
                    ? (scannedQR as any).remainingAmount
                    : (scannedQR as any).paidAmount
                )}
              </Text>
            </View>
          </View>

          <View style={styles.receiptFooter}>
            <Text style={styles.receiptFooterText}>
              Thank you for using Fuel Gambia
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Print Receipt"
            onPress={() => {}}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Done"
            onPress={handleDone}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginTop: 16,
  },
  receiptCard: {
    marginBottom: 24,
    padding: 24,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  receiptSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  receiptBody: {
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'capitalize',
  },
  receiptFooter: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'center',
  },
  receiptFooterText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    width: '100%',
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
    marginBottom: 24,
  },
  backButton: {
    marginTop: 16,
  },
});
