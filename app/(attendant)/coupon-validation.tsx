import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAttendantStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/format';
import { TransactionMode } from '../../types';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.ATTENDANT;

export default function CouponValidationScreen() {
  const router = useRouter();
  const { scannedQR, clearScannedQR } = useAttendantStore();

  if (!scannedQR) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No QR code scanned</Text>
          <Button
            title="Go Back"
            onPress={() => {
              clearScannedQR();
              router.back();
            }}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isValid = !scannedQR.expiry || new Date(scannedQR.expiry) > new Date();
  const isSubsidy = scannedQR.mode === TransactionMode.SUBSIDY;
  const amount =
    scannedQR.mode === TransactionMode.SUBSIDY
      ? (scannedQR as any).remainingAmount
      : (scannedQR as any).paidAmount;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons
            name={isValid ? 'checkmark-circle' : 'close-circle'}
            size={64}
            color={isValid ? theme.secondary : '#FF3B30'}
          />
          <Text style={styles.statusTitle}>
            {isValid ? 'Valid Coupon' : 'Invalid Coupon'}
          </Text>
        </View>

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mode</Text>
            <Text style={styles.detailValue}>{scannedQR.mode}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fuel Type</Text>
            <Text style={styles.detailValue}>{scannedQR.fuelType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {isSubsidy ? 'Remaining Amount' : 'Paid Amount'}
            </Text>
            <Text style={styles.detailValue}>{formatCurrency(amount)}</Text>
          </View>
          {scannedQR.expiry && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expires</Text>
              <Text style={styles.detailValue}>
                {formatDate(scannedQR.expiry)}
              </Text>
            </View>
          )}
        </Card>

        {isValid && (
          <Button
            title="Proceed to Dispense"
            onPress={() => router.push('/(attendant)/fuel-allocation')}
            style={styles.proceedButton}
          />
        )}

        <Button
          title="Scan Another"
          onPress={() => {
            clearScannedQR();
            router.push('/(attendant)/scanner');
          }}
          variant="outline"
          style={styles.scanButton}
        />
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
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginTop: 16,
  },
  detailsCard: {
    marginBottom: 24,
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'capitalize',
  },
  proceedButton: {
    marginBottom: 12,
  },
  scanButton: {
    marginTop: 8,
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
