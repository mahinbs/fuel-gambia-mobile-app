import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAttendantStore } from '../../store';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/format';
import { COLOR_THEMES, FUEL_PRICES } from '../../utils/constants';

const theme = COLOR_THEMES.ATTENDANT;

export default function FuelAllocationScreen() {
  const router = useRouter();
  const { scannedQR, inventory, dispenseFuel, isLoading } = useAttendantStore();

  if (!scannedQR || !inventory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No QR code or inventory data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSubsidy = scannedQR.mode === 'SUBSIDY';
  const pricePerLiter = (FUEL_PRICES as any)[scannedQR.fuelType] || 1;
  
  // Calculate quantity to dispense
  const liters = isSubsidy 
    ? (scannedQR as any).remainingAmount 
    : ((scannedQR as any).paidAmount / pricePerLiter);

  const gmdAmount = isSubsidy 
    ? liters * pricePerLiter 
    : (scannedQR as any).paidAmount;

  const availableStock =
    scannedQR.fuelType === 'PETROL'
      ? inventory.petrolStock
      : inventory.dieselStock;

  const handleDispense = async () => {
    if (liters > availableStock) {
      Alert.alert('Error', 'Insufficient stock available at this station');
      return;
    }

    const success = await dispenseFuel(liters, scannedQR.fuelType as any);
    if (success) {
      Alert.alert('Success', 'Fuel dispensed and transaction completed successfully!', [
        { text: 'OK', onPress: () => router.push('/(attendant)/receipt') }
      ]);
    } else {
      Alert.alert('Error', 'Failed to dispense fuel. Please check connection and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Confirm Dispensing</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Station Stock Status</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Station Name</Text>
              <Text style={styles.infoValue}>{inventory.stationName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fuel Type</Text>
              <View style={styles.fuelTypeRow}>
                <Ionicons
                  name={scannedQR.fuelType === 'PETROL' ? 'flame' : 'water'}
                  size={18}
                  color={scannedQR.fuelType === 'PETROL' ? '#FF9500' : theme.primary}
                />
                <Text style={styles.infoValue}>{scannedQR.fuelType}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Available Stock</Text>
              <Text style={styles.infoValue}>
                {availableStock.toLocaleString()} L
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispense Summary</Text>
          
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Beneficiary Name</Text>
              <Text style={styles.summaryValue}>{scannedQR.userName || 'Unknown'}</Text>
            </View>
            {(scannedQR as any).departmentName ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Department</Text>
                <Text style={styles.summaryValue}>{(scannedQR as any).departmentName}</Text>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Mode</Text>
              <Text style={styles.summaryValue}>
                {isSubsidy ? 'Subsidy Quota (Liters)' : 'Paid Purchase'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Equivalent GMD Value</Text>
              <Text style={styles.summaryValue}>{formatCurrency(gmdAmount)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>Volume to Dispense</Text>
              <Text style={styles.summaryValueTotal}>{liters.toFixed(2)} L</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Stock After</Text>
              <Text style={[styles.summaryValue, { color: (availableStock - liters) < 1000 ? '#FF3B30' : '#000000' }]}>
                {Math.max(0, availableStock - liters).toLocaleString()} L
              </Text>
            </View>
          </Card>

          <Button
            title="Confirm & Mark Done"
            onPress={handleDispense}
            loading={isLoading}
            disabled={liters <= 0 || liters > availableStock}
            style={styles.submitButton}
          />
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
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    marginBottom: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  fuelTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryCard: {
    marginTop: 8,
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginBottom: 16,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.primary,
  },
  submitButton: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.primary,
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
  },
});
