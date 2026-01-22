import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useCustomerStore } from '../../store';
import { fuelPurchaseSchema } from '../../utils/validation';
import { formatCurrency } from '../../utils/format';
import { calculateLiters } from '../../utils/qr';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.USER;

type PurchaseFormData = z.infer<typeof fuelPurchaseSchema>;

export default function FuelPurchaseScreen() {
  const router = useRouter();
  const { createPaymentIntent, isLoading } = useCustomerStore();
  const [selectedFuelType, setSelectedFuelType] = useState<'PETROL' | 'DIESEL'>('PETROL');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(fuelPurchaseSchema),
    defaultValues: {
      fuelType: 'PETROL',
      amount: 0,
    },
  });

  React.useEffect(() => {
    setValue('fuelType', selectedFuelType);
  }, [selectedFuelType, setValue]);

  const amount = watch('amount');
  const liters = amount > 0 ? calculateLiters(amount, selectedFuelType) : 0;
  const pricePerLiter = selectedFuelType === 'PETROL' ? 65 : 68;

  const onSubmit = async (data: PurchaseFormData) => {
    await createPaymentIntent(data.amount, selectedFuelType);
    router.push('/(customer)/payment');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Purchase Fuel</Text>
        <Text style={styles.subtitle}>Select fuel type and amount</Text>

        <View style={styles.fuelTypeSection}>
          <Text style={styles.sectionTitle}>Fuel Type</Text>
          <View style={styles.fuelTypeOptions}>
            <TouchableOpacity
              style={[
                styles.fuelTypeCard,
                selectedFuelType === 'PETROL' && styles.fuelTypeCardActive,
              ]}
              onPress={() => setSelectedFuelType('PETROL')}
            >
              <Ionicons
                name="flame"
                size={32}
                color={selectedFuelType === 'PETROL' ? '#FF9500' : '#8E8E93'}
              />
              <Text
                style={[
                  styles.fuelTypeText,
                  selectedFuelType === 'PETROL' && styles.fuelTypeTextActive,
                ]}
              >
                Petrol
              </Text>
              <Text style={styles.fuelTypePrice}>65 GMD/L</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fuelTypeCard,
                selectedFuelType === 'DIESEL' && styles.fuelTypeCardActive,
              ]}
              onPress={() => setSelectedFuelType('DIESEL')}
            >
              <Ionicons
                name="water"
                size={32}
                color={selectedFuelType === 'DIESEL' ? theme.primary : '#8E8E93'}
              />
              <Text
                style={[
                  styles.fuelTypeText,
                  selectedFuelType === 'DIESEL' && styles.fuelTypeTextActive,
                ]}
              >
                Diesel
              </Text>
              <Text style={styles.fuelTypePrice}>68 GMD/L</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Amount (GMD)"
              placeholder="Enter amount"
              value={value.toString()}
              onChangeText={(text) => onChange(parseFloat(text) || 0)}
              onBlur={onBlur}
              error={errors.amount?.message}
              keyboardType="numeric"
            />
          )}
        />

        {amount > 0 && (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>{formatCurrency(amount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fuel Type</Text>
              <Text style={styles.summaryValue}>{selectedFuelType}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price per Liter</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(pricePerLiter)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryLabelTotal}>Liters</Text>
              <Text style={styles.summaryValueTotal}>
                {liters.toFixed(2)} L
              </Text>
            </View>
          </Card>
        )}

        <Button
          title="Proceed to Payment"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={amount <= 0}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  fuelTypeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  fuelTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  fuelTypeCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  fuelTypeCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  fuelTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 4,
  },
  fuelTypeTextActive: {
    color: '#007AFF',
  },
  fuelTypePrice: {
    fontSize: 12,
    color: '#8E8E93',
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
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  submitButton: {
    marginTop: 8,
  },
});
