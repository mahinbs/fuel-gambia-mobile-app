import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAttendantStore, useAuthStore } from '../../store';
import { FUEL_PRICES, COLOR_THEMES } from '../../utils/constants';
import { formatCurrency } from '../../utils/format';
import { FuelType } from '../../types';

const theme = COLOR_THEMES.ATTENDANT;

const cashSaleSchema = z.object({
  fuelType: z.enum(['PETROL', 'DIESEL', 'KEROSENE', 'BUTANE']),
  amount: z.number().min(1, 'Amount must be at least 1 GMD'),
});

type CashSaleFormData = z.infer<typeof cashSaleSchema>;

export default function CashSaleScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isLoading, recordCashSale, inventory, fetchInventory } = useAttendantStore();
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>(FuelType.PETROL);

  useEffect(() => {
    if (!inventory) {
      const stationId = (user && 'stationId' in user && (user as any).stationId) 
        ? (user as any).stationId 
        : 'station1';
      fetchInventory(stationId);
    }
  }, [user, inventory, fetchInventory]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CashSaleFormData>({
    resolver: zodResolver(cashSaleSchema),
    defaultValues: {
      fuelType: FuelType.PETROL,
      amount: 0,
    },
  });

  const amount = watch('amount');
  const pricePerUnit = FUEL_PRICES[selectedFuelType];
  const units = amount > 0 ? (amount / pricePerUnit) : 0;

  const onSubmit = async (data: CashSaleFormData) => {
    if (!inventory) {
      Alert.alert('Error', 'Station inventory not loaded. Please try again.');
      return;
    }

    try {
      const success = await recordCashSale({
        fuelType: selectedFuelType,
        amount: data.amount,
        liters: units,
      });

      if (success) {
        Alert.alert(
          'Success',
          `Cash sale of ${formatCurrency(data.amount)} (${units.toFixed(2)} units) recorded successfully.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error('Failed to record sale');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record cash sale');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Cash Sale</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Fuel Type</Text>
          <View style={styles.fuelTypeContainer}>
            {(['PETROL', 'DIESEL', 'KEROSENE', 'BUTANE'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.fuelTypeCard,
                  selectedFuelType === type && styles.activeFuelTypeCard,
                ]}
                onPress={() => {
                  setSelectedFuelType(type as FuelType);
                  setValue('fuelType', type as FuelType);
                }}
              >
                <Ionicons
                  name={type === 'PETROL' ? 'flame' : type === 'DIESEL' ? 'water' : type === 'KEROSENE' ? 'flask' : 'bonfire'}
                  size={24}
                  color={selectedFuelType === type ? '#FFFFFF' : theme.primary}
                />
                <Text
                  style={[
                    styles.fuelTypeText,
                    selectedFuelType === type && styles.activeFuelTypeText,
                  ]}
                >
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sale Details</Text>
          <Card style={styles.formCard}>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Amount (GMD)"
                  placeholder="0.00"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    const val = parseFloat(text);
                    onChange(isNaN(val) ? 0 : val);
                  }}
                  value={value === 0 ? '' : value.toString()}
                  error={errors.amount?.message}
                />
              )}
            />

            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Price per unit</Text>
                <Text style={styles.summaryValue}>{formatCurrency(pricePerUnit)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Units</Text>
                <Text style={styles.summaryValue}>{units.toFixed(2)} {selectedFuelType === 'BUTANE' ? 'Units' : 'Liters'}</Text>
              </View>
            </View>

            <Button
              title="Record Sale"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.submitButton}
            />
          </Card>
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
  fuelTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fuelTypeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activeFuelTypeCard: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  fuelTypeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  activeFuelTypeText: {
    color: '#FFFFFF',
  },
  formCard: {
    padding: 24,
    borderRadius: 24,
  },
  summaryContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  submitButton: {
    marginTop: 32,
    height: 56,
    borderRadius: 16,
  },
});
