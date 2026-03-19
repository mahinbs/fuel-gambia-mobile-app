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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAttendantStore } from '../../store';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/format';
import { calculateLiters } from '../../utils/qr';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.ATTENDANT;

const allocationSchema = z.object({
  amount: z.number().min(100).max(10000),
});

type AllocationFormData = z.infer<typeof allocationSchema>;

export default function FuelAllocationScreen() {
  const router = useRouter();
  const { scannedQR, inventory, dispenseFuel, isLoading } = useAttendantStore();
  const [liters, setLiters] = useState(0);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AllocationFormData>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const amount = watch('amount');

  React.useEffect(() => {
    if (scannedQR && amount > 0) {
      const calculatedLiters = calculateLiters(amount, scannedQR.fuelType as any);
      setLiters(calculatedLiters);
    }
  }, [amount, scannedQR]);

  if (!scannedQR || !inventory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No QR code or inventory data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const availableStock =
    scannedQR.fuelType === 'PETROL'
      ? inventory.petrolStock
      : inventory.dieselStock;

  const onSubmit = async (data: AllocationFormData) => {
    if (liters > availableStock) {
      Alert.alert('Error', 'Insufficient stock available');
      return;
    }

    const success = await dispenseFuel(liters, scannedQR.fuelType);
    if (success) {
      router.push('/(attendant)/receipt');
    } else {
      Alert.alert('Error', 'Failed to dispense fuel');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Dispense Fuel</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel Information</Text>
          <Card style={styles.infoCard}>
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
          <Text style={styles.sectionTitle}>Allocation Details</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Amount to Dispense (GMD)"
                placeholder="Enter amount"
                value={value === 0 ? '' : value.toString()}
                onChangeText={(text) => {
                  const val = parseFloat(text);
                  onChange(isNaN(val) ? 0 : val);
                }}
                onBlur={onBlur}
                error={errors.amount?.message}
                keyboardType="numeric"
              />
            )}
          />

          {liters > 0 && (
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(amount)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Liters</Text>
                <Text style={styles.summaryValue}>{liters.toFixed(2)} L</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remaining Stock</Text>
                <Text style={[styles.summaryValue, { color: (availableStock - liters) < 1000 ? '#FF3B30' : '#000000' }]}>
                  {(availableStock - liters).toLocaleString()} L
                </Text>
              </View>
            </Card>
          )}

          <Button
            title="Confirm & Dispense"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={liters <= 0 || liters > availableStock}
            style={styles.submitButton}
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
    fontSize: 28,
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
    padding: 24,
    borderRadius: 24,
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
    marginTop: 16,
    marginBottom: 24,
    padding: 24,
    borderRadius: 24,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  submitButton: {
    marginTop: 32,
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
  },
});
