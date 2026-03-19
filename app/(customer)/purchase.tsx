import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuthStore, useCustomerStore, useBeneficiaryStore } from '../../store';
import { fuelPurchaseSchema } from '../../utils/validation';
import { formatCurrency } from '../../utils/format';
import { calculateLiters } from '../../utils/qr';
import { COLOR_THEMES, FUEL_PRICES } from '../../utils/constants';
import { FuelType } from '../../types';

const theme = COLOR_THEMES.USER;

type PurchaseFormData = z.infer<typeof fuelPurchaseSchema>;

export default function FuelPurchaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fuelType: string }>();
  const { user } = useAuthStore();
  const { createPaymentIntent, isLoading } = useCustomerStore();
  
  const [step, setStep] = useState(1);
  const [selectedFuelType, setSelectedFuelType] = useState<string>(params.fuelType || 'PETROL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedSubMethod, setSelectedSubMethod] = useState<string>('');

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
    setValue('fuelType', selectedFuelType as any);
  }, [selectedFuelType, setValue]);

  const amount = watch('amount');
  const liters = amount > 0 ? calculateLiters(amount, selectedFuelType as any) : 0;
  const pricePerLiter = (FUEL_PRICES as any)[selectedFuelType] || 0;

  const { beneficiary, updateBalance } = useBeneficiaryStore();

  const paymentConfigs = [
    ...(user?.isBeneficiary ? [{ id: 'Coupon', label: 'Government Fuel Coupon', icon: 'ticket-outline' }] : []),
    { id: 'Wallet', label: 'Wallet', icon: 'wallet-outline', subOptions: ['FuelGambia Wallet', 'e-Dalasi', 'Qmoney'] },
    { id: 'MobileMoney', label: 'Mobile Money', icon: 'phone-portrait-outline', subOptions: ['Africell Money', 'QCell QMoney'] },
    { id: 'Bank', label: 'Bank Transfer', icon: 'business-outline', subOptions: ['GTBank', 'Trust Bank', 'EcoBank'] },
    { id: 'Card', label: 'Credit/Debit Card', icon: 'card-outline' },
  ];

  const onSubmit = async (data: PurchaseFormData) => {
    if (step === 1) {
      if (data.amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
      setStep(2);
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (paymentConfigs.find(c => c.id === selectedPaymentMethod)?.subOptions && !selectedSubMethod) {
      Alert.alert('Error', 'Please select a specific provider');
      return;
    }

    // Handle Coupon payment logic
    if (selectedPaymentMethod === 'Coupon') {
      if (!beneficiary) {
        Alert.alert('Error', 'Beneficiary account not found');
        return;
      }
      if (data.amount > beneficiary.remainingBalance) {
        Alert.alert('Insufficient Balance', `Your coupon remaining balance is ${formatCurrency(beneficiary.remainingBalance)}`);
        return;
      }

      // Deduct from balance
      updateBalance(data.amount);
      
      router.push({
        pathname: '/(customer)/qr-code',
        params: { 
          amount: data.amount,
          fuelType: selectedFuelType,
          paymentMethod: selectedSubMethod || 'Government Coupon',
          success: 'true',
          mode: 'SUBSIDY'
        }
      });
      return;
    }

    await createPaymentIntent(data.amount, selectedFuelType as any);
    router.push({
      pathname: '/(customer)/qr-code',
      params: { 
        amount: data.amount,
        fuelType: selectedFuelType,
        paymentMethod: selectedSubMethod || selectedPaymentMethod,
        success: 'true',
        mode: 'PAID'
      }
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
      <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
      <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => step === 1 ? router.back() : setStep(1)} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Purchase Fuel</Text>
          <Text style={styles.subtitle}>{step === 1 ? 'Step 1: Selection' : 'Step 2: Payment'}</Text>
        </View>
        {renderStepIndicator()}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Fuel Type</Text>
              <View style={styles.fuelTypeOptions}>
                {(['PETROL', 'DIESEL', 'KEROSENE', 'BUTANE'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.fuelTypeCard,
                      selectedFuelType === type && styles.fuelTypeCardActive,
                    ]}
                    onPress={() => setSelectedFuelType(type)}
                  >
                    <View style={[
                      styles.fuelIconContainer,
                      selectedFuelType === type && { backgroundColor: theme.primary + '15' }
                    ]}>
                      <Ionicons
                        name={type === 'PETROL' ? 'flame' : type === 'DIESEL' ? 'water' : type === 'KEROSENE' ? 'flask' : 'bonfire'}
                        size={28}
                        color={selectedFuelType === type ? theme.primary : '#C7C7CC'}
                      />
                    </View>
                    <Text style={[styles.fuelTypeText, selectedFuelType === type && styles.fuelTypeTextActive]}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </Text>
                    <Text style={styles.fuelTypePrice}>{(FUEL_PRICES as any)[type]} GMD/u</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amount</Text>
              <Card style={styles.amountCard}>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Amount to Buy (GMD)"
                      placeholder="Enter amount"
                      value={value === 0 ? '' : value.toString()}
                      onChangeText={(text) => {
                        const val = parseFloat(text);
                        onChange(isNaN(val) ? 0 : val);
                      }}
                      onBlur={onBlur}
                      error={errors.amount?.message}
                      keyboardType="numeric"
                      style={styles.amountInput}
                    />
                  )}
                />

                {amount > 0 && (
                  <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Price per Unit</Text>
                      <Text style={styles.summaryValue}>{formatCurrency(pricePerLiter)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Estimated Fuel</Text>
                      <Text style={styles.summaryValueTotal}>{liters.toFixed(2)} Liters</Text>
                    </View>
                  </View>
                )}
              </Card>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Payment Method</Text>
              <View style={styles.paymentMethodsContainer}>
                {paymentConfigs.map((config) => {
                  const isCoupon = config.id === 'Coupon';
                  const isInsufficient = !!(isCoupon && beneficiary && amount > beneficiary.remainingBalance);
                  const balanceAfter = isCoupon && beneficiary ? beneficiary.remainingBalance - amount : 0;

                  return (
                    <View key={config.id}>
                      <TouchableOpacity
                        style={[
                          styles.paymentMethodCard,
                          selectedPaymentMethod === config.id && styles.paymentMethodCardActive,
                          isInsufficient && styles.paymentMethodCardDisabled,
                        ]}
                        onPress={() => {
                          if (isInsufficient) return;
                          setSelectedPaymentMethod(config.id);
                          setSelectedSubMethod('');
                        }}
                        disabled={isInsufficient}
                        activeOpacity={isInsufficient ? 1 : 0.7}
                      >
                        <View style={[
                          styles.paymentIconContainer,
                          {
                            backgroundColor:
                              isInsufficient ? '#F2F2F7' :
                                selectedPaymentMethod === config.id ? theme.primary + '15' : '#F2F2F7'
                          }
                        ]}>
                          <Ionicons
                            name={config.icon as any}
                            size={24}
                            color={
                              isInsufficient ? '#C7C7CC' :
                                selectedPaymentMethod === config.id ? theme.primary : "#8E8E93"
                            }
                          />
                        </View>
                        <View style={styles.paymentMethodInfo}>
                          <View style={styles.paymentTitleRow}>
                            <Text style={[
                              styles.paymentMethodText,
                              selectedPaymentMethod === config.id && styles.paymentMethodTextActive,
                              isInsufficient && styles.paymentMethodTextDisabled,
                            ]}>{config.label}</Text>
                            {isCoupon && beneficiary && (
                              <Text style={styles.couponBalanceTag}>
                                {formatCurrency(beneficiary.remainingBalance)} available
                              </Text>
                            )}
                          </View>

                          {isInsufficient ? (
                            <Text style={styles.disclaimerText}>
                               Insufficient coupon balance
                            </Text>
                          ) : (
                            <Text style={styles.paymentMethodSubtitle}>
                              {isCoupon && selectedPaymentMethod === 'Coupon'
                                ? `Balance after purchase: ${formatCurrency(balanceAfter)}`
                                : config.id === 'Wallet' ? 'Quick & Easy' : 'Secure Transaction'}
                            </Text>
                          )}
                        </View>
                        <View style={[
                          styles.radioCircle,
                          selectedPaymentMethod === config.id && { borderColor: theme.primary },
                          isInsufficient && { borderColor: '#E5E5EA', opacity: 0.5 }
                        ]}>
                          {selectedPaymentMethod === config.id && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
                          {isInsufficient && <Ionicons name="lock-closed" size={12} color="#C7C7CC" />}
                        </View>
                      </TouchableOpacity>

                      {selectedPaymentMethod === config.id && config.subOptions && (
                        <View style={styles.subOptionsContainer}>
                          {config.subOptions.map((sub) => (
                            <TouchableOpacity
                              key={sub}
                              style={[
                                styles.subOptionItem,
                                selectedSubMethod === sub && styles.subOptionItemActive
                              ]}
                              onPress={() => setSelectedSubMethod(sub)}
                            >
                              <Text style={[
                                styles.subOptionText,
                                selectedSubMethod === sub && styles.subOptionTextActive
                              ]}>{sub}</Text>
                              {selectedSubMethod === sub && (
                                <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
            
            <Card style={styles.orderSummaryCard}>
              <Text style={styles.orderSummaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fuel Type</Text>
                <Text style={styles.summaryValue}>{selectedFuelType}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValueTotal}>{formatCurrency(amount)}</Text>
              </View>
            </Card>
          </View>
        )}

        <Button
          title={step === 1 ? "Next Step" : "Confirm & Pay"}
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={step === 1 ? amount <= 0 : !selectedPaymentMethod || (paymentConfigs.find(c => c.id === selectedPaymentMethod)?.subOptions && !selectedSubMethod)}
          style={styles.submitButton}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
  },
  stepDotActive: {
    backgroundColor: theme.primary,
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: '#E5E5EA',
  },
  stepLineActive: {
    backgroundColor: theme.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fuelTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fuelTypeCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  fuelTypeCardActive: {
    borderColor: theme.primary,
  },
  fuelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  fuelTypeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3A3A3C',
  },
  fuelTypeTextActive: {
    color: theme.primary,
  },
  fuelTypePrice: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 2,
  },
  amountCard: {
    padding: 20,
    borderRadius: 24,
  },
  amountInput: {
    marginBottom: 0,
  },
  summaryContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 12,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.primary,
  },
  paymentMethodsContainer: {
    gap: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
  },
  paymentMethodCardActive: {
    borderColor: theme.primary,
    backgroundColor: '#FFFFFF',
  },
  paymentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  paymentMethodTextActive: {
    color: theme.primary,
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subOptionsContainer: {
    marginTop: 8,
    marginLeft: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2F2F7',
    overflow: 'hidden',
  },
  subOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  subOptionItemActive: {
    backgroundColor: theme.primary + '08',
  },
  subOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  subOptionTextActive: {
    color: theme.primary,
    fontWeight: '700',
  },
  orderSummaryCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  orderSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
  },
  paymentMethodCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#F9F9F9',
    borderColor: '#E5E5EA',
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentMethodTextDisabled: {
    color: '#C7C7CC',
  },
  couponBalanceTag: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
    backgroundColor: theme.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
});
