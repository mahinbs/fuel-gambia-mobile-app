import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
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
      const calculatedLiters = calculateLiters(amount, scannedQR.fuelType);
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
        <Text style={styles.title}>Dispense Fuel</Text>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fuel Type</Text>
            <Text style={styles.infoValue}>{scannedQR.fuelType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Available Stock</Text>
            <Text style={styles.infoValue}>
              {availableStock.toLocaleString()} L
            </Text>
          </View>
        </Card>

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Amount to Dispense (GMD)"
              placeholder="Enter amount"
              value={value.toString()}
              onChangeText={(text) => onChange(parseFloat(text) || 0)}
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
              <Text style={styles.summaryValue}>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 24,
  },
  infoCard: {
    marginBottom: 24,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  summaryCard: {
    marginTop: 16,
    marginBottom: 24,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  submitButton: {
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
  },
});
