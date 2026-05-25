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
import { COLOR_THEMES, FUEL_PRICES } from '../../utils/constants';

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
  
  // Calculate quantity to dispense
  const liters = isSubsidy 
    ? (scannedQR as any).remainingAmount 
    : ((scannedQR as any).paidAmount / ((FUEL_PRICES as any)[scannedQR.fuelType] || 1));

  const amountText = isSubsidy
    ? `${(scannedQR as any).remainingAmount} L (Subsidy)`
    : `${formatCurrency((scannedQR as any).paidAmount)} (${(scannedQR as any).paymentMethod})`;

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
            {isValid ? 'Valid QR Code' : 'Invalid QR Code'}
          </Text>
        </View>

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>User Name</Text>
            <Text style={styles.detailValue}>{scannedQR.userName || 'Unknown User'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>User Tag</Text>
            <View style={[
              styles.tagBadge,
              { backgroundColor: scannedQR.userType === 'BENEFICIARY' ? '#E3F2FD' : '#F2F2F7' }
            ]}>
              <Text style={[
                styles.tagText,
                { color: scannedQR.userType === 'BENEFICIARY' ? theme.primary : '#8E8E93' }
              ]}>
                {scannedQR.userType || 'NORMAL'}
              </Text>
            </View>
          </View>
          
          {(scannedQR as any).departmentName ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Department</Text>
              <Text style={styles.detailValue}>{(scannedQR as any).departmentName}</Text>
            </View>
          ) : null}

          {(scannedQR as any).governmentId ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Government ID</Text>
              <Text style={styles.detailValue}>{(scannedQR as any).governmentId}</Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Mode</Text>
            <Text style={styles.detailValue}>
              {isSubsidy ? 'Allocated Fuel Quota (Subsidy)' : 'Paid Purchase'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fuel Type</Text>
            <View style={styles.fuelTypeRow}>
              <Ionicons
                name={scannedQR.fuelType === 'PETROL' ? 'flame' : 'water'}
                size={18}
                color={scannedQR.fuelType === 'PETROL' ? '#FF9500' : theme.primary}
              />
              <Text style={styles.detailValue}>{scannedQR.fuelType}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Liters to Dispense</Text>
            <Text style={[styles.detailValue, styles.amountText]}>
              {liters.toFixed(2)} L
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Details</Text>
            <Text style={styles.detailValue}>{amountText}</Text>
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
    marginBottom: 32,
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fuelTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountText: {
    fontSize: 18,
    color: theme.secondary,
  },
  proceedButton: {
    marginBottom: 16,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.primary,
  },
  scanButton: {
    marginTop: 8,
    height: 56,
    borderRadius: 16,
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
