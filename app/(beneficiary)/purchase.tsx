import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useBeneficiaryStore, useAuthStore } from '../../store';
import { formatCurrency } from '../../utils/format';
import { calculateLiters } from '../../utils/qr';
import { COLOR_THEMES, FUEL_PRICES } from '../../utils/constants';
import { transactionService } from '../../services/transactionService';

const theme = COLOR_THEMES.BENEFICIARY;

const localPurchaseSchema = z.object({
  fuelType: z.enum(['PETROL', 'DIESEL', 'KEROSENE', 'BUTANE']),
  amount: z.number().min(0.01, 'Please enter a valid amount'),
});

type PurchaseFormData = z.infer<typeof localPurchaseSchema>;

export default function BeneficiaryPurchaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fuelType: string }>();
  const { user } = useAuthStore();
  const { beneficiary, saveQRCode } = useBeneficiaryStore();
  const [selectedFuelType, setSelectedFuelType] = useState<string>(params.fuelType || 'PETROL');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Coupon');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(localPurchaseSchema),
    defaultValues: {
      fuelType: 'PETROL',
      amount: 0,
    },
  });

  React.useEffect(() => {
    if (params.fuelType) {
      setSelectedFuelType(params.fuelType);
    }
  }, [params.fuelType]);

  React.useEffect(() => {
    setValue('fuelType', selectedFuelType as any);
  }, [selectedFuelType, setValue]);

  const amount = watch('amount');
  const pricePerLiter = (FUEL_PRICES as any)[selectedFuelType] || 0;
  
  // Calculations based on payment method
  const gmdAmount = selectedPaymentMethod === 'Coupon' ? amount * pricePerLiter : amount;
  const liters = selectedPaymentMethod === 'Coupon' ? amount : (amount > 0 ? calculateLiters(amount, selectedFuelType as any) : 0);

  const hasBalance = beneficiary && beneficiary.remainingBalance > 0;
  const hasSubsidizedBalance = hasBalance;

  const onSubmit = async (data: PurchaseFormData) => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User profile not loaded');
      return;
    }
    
    setIsLoading(true);
    
    // Check if using subsidized balance
    if (selectedPaymentMethod === 'Coupon') {
      if (liters > (beneficiary?.remainingBalance || 0)) {
         Alert.alert('Insufficient Quota', 'You do not have enough allocated quota for this purchase.');
         setIsLoading(false);
         return;
      }
    } else {
      // Validate payment methods in currency GMD
      if (data.amount < 100) {
        Alert.alert('Invalid Amount', 'Minimum amount is 100 GMD.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const mode = selectedPaymentMethod === 'Coupon' ? 'SUBSIDY' : 'PAID';
      const pMethod = selectedPaymentMethod === 'Coupon' ? 'COUPON' : (selectedPaymentMethod === 'Wallet' ? 'WALLET' : 'BANK_TRANSFER');
      
      const qrCodeToken = `QR_${mode}_${user.id}_${Date.now()}`;

      // Insert pending transaction record in Supabase
      const newTx = await transactionService.createTransaction({
        userId: user.id,
        fuelType: selectedFuelType as any,
        amount: gmdAmount,
        liters: liters,
        mode: mode as any,
        status: 'PENDING' as any,
        qrCode: qrCodeToken,
      });

      if (!newTx) {
        throw new Error('Failed to save pending transaction in database');
      }

      // Save QR code in local store cache
      const payload = {
        transactionId: newTx.id,
        qrCodeToken: qrCodeToken,
        userId: user.id,
        userName: beneficiary?.name || user.name || 'User',
        userType: 'BENEFICIARY' as const,
        fuelType: selectedFuelType as any,
        paidAmount: gmdAmount,
        remainingAmount: liters,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        mode: mode as any,
        paymentMethod: pMethod,
      };

      if (saveQRCode) {
        saveQRCode({
          id: qrCodeToken,
          qrData: JSON.stringify(payload),
          payload: payload,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        });
      }

      setIsLoading(false);
      router.push({
        pathname: '/(beneficiary)/qr-code',
        params: {
          qrId: qrCodeToken,
          success: 'true'
        },
      });
    } catch (err: any) {
      console.error('Error initiating purchase:', err);
      Alert.alert('Error', err.message || 'Failed to initiate purchase');
      setIsLoading(false);
    }
  };

  if (!beneficiary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No beneficiary data found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Purchase Fuel</Text>
        <Text style={styles.subtitle}>Select payment method and quantity</Text>

        {hasBalance && (
          <Card style={[styles.balanceCard, { backgroundColor: theme.secondary }]}>
            <View style={styles.balanceContent}>
              <Ionicons name="wallet" size={24} color="#FFFFFF" />
              <View style={styles.balanceText}>
                <Text style={styles.balanceLabel}>Remaining Allocation Quota</Text>
                <Text style={styles.balanceValue}>
                  {beneficiary.remainingBalance} L
                </Text>
              </View>
            </View>
          </Card>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethodsContainer}>
            {hasSubsidizedBalance && (
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === 'Coupon' && styles.paymentMethodCardActive,
                ]}
                onPress={() => {
                  setSelectedPaymentMethod('Coupon');
                  setValue('amount', 0);
                }}
              >
                <Ionicons 
                  name={selectedPaymentMethod === 'Coupon' ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={selectedPaymentMethod === 'Coupon' ? theme.primary : "#8E8E93"} 
                />
                <Text style={[
                  styles.paymentMethodText,
                  selectedPaymentMethod === 'Coupon' && styles.paymentMethodTextActive
                ]}>Government Subsidy</Text>
              </TouchableOpacity>
            )}
            {['Wallet', 'Bank Account'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === method && styles.paymentMethodCardActive,
                ]}
                onPress={() => {
                  setSelectedPaymentMethod(method);
                  setValue('amount', 0);
                }}
              >
                <Ionicons 
                  name={selectedPaymentMethod === method ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={selectedPaymentMethod === method ? theme.primary : "#8E8E93"} 
                />
                <Text style={[
                  styles.paymentMethodText,
                  selectedPaymentMethod === method && styles.paymentMethodTextActive
                ]}>{method}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedPaymentMethod === 'Coupon' && (
            <Card style={styles.subsidyDetailsCard}>
              <Text style={styles.subsidyDetailsTitle}>Government Subsidy Details</Text>
              <View style={styles.subsidyDetailsRow}>
                <Text style={styles.subsidyDetailsLabel}>Allocated quota:</Text>
                <Text style={styles.subsidyDetailsValue}>{beneficiary.monthlyAllocation} L</Text>
              </View>
              <View style={styles.subsidyDetailsRow}>
                <Text style={styles.subsidyDetailsLabel}>Remaining quota:</Text>
                <Text style={styles.subsidyDetailsValue}>{beneficiary.remainingBalance} L</Text>
              </View>
              <View style={styles.subsidyDetailsRow}>
                <Text style={styles.subsidyDetailsLabel}>Department:</Text>
                <Text style={styles.subsidyDetailsValue}>{beneficiary.departmentName || 'Not set'}</Text>
              </View>
              <View style={styles.subsidyDetailsRow}>
                <Text style={styles.subsidyDetailsLabel}>Expiry date:</Text>
                <Text style={styles.subsidyDetailsValue}>{new Date(beneficiary.expiryDate).toLocaleDateString()}</Text>
              </View>
            </Card>
          )}
        </View>

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={selectedPaymentMethod === 'Coupon' ? "Liters (L)" : "Amount (GMD)"}
              placeholder={selectedPaymentMethod === 'Coupon' ? "Enter liters (e.g. 50)" : "Enter amount (e.g. 500)"}
              value={value === 0 ? '' : value.toString()}
              onChangeText={(text) => onChange(parseFloat(text) || 0)}
              onBlur={onBlur}
              error={errors.amount?.message}
              keyboardType="numeric"
            />
          )}
        />

        {(() => {
          const isSubsidyExceeded = selectedPaymentMethod === 'Coupon' && amount > (beneficiary?.remainingBalance || 0);
          return (
            <>
              {isSubsidyExceeded && (
                <Card style={styles.warningCard}>
                  <View style={styles.warningHeader}>
                    <Ionicons name="alert-circle" size={24} color="#FF9500" />
                    <Text style={styles.warningTitle}>Allocation Limit Exceeded</Text>
                  </View>
                  <Text style={styles.warningText}>
                    Warning: The requested quantity of {amount} L exceeds your remaining subsidy balance of {beneficiary.remainingBalance} L.
                    Please reduce the liters, or select **Wallet** or **Bank Account** to make a paid purchase.
                  </Text>
                </Card>
              )}

              {amount > 0 && (
                <Card style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Equivalent GMD Value</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(gmdAmount)}</Text>
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
                    <Text style={styles.summaryLabelTotal}>Total Liters</Text>
                    <Text style={styles.summaryValueTotal}>
                      {liters.toFixed(2)} L
                    </Text>
                  </View>
                </Card>
              )}

              <Button
                title="Pay & Generate QR"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={amount <= 0 || isSubsidyExceeded}
                style={styles.submitButton}
              />
            </>
          );
        })()}
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
  balanceCard: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    marginLeft: 16,
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
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
  paymentMethodsContainer: {
    gap: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  paymentMethodCardActive: {
    borderColor: theme.primary,
    backgroundColor: '#F0F8FF',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  paymentMethodTextActive: {
    color: theme.primary,
    fontWeight: '600',
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
  subsidyDetailsCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F3F0FF',
    borderRadius: 16,
    borderColor: '#D1C4E9',
    borderWidth: 1,
  },
  subsidyDetailsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#512DA8',
    marginBottom: 10,
  },
  subsidyDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subsidyDetailsLabel: {
    fontSize: 13,
    color: '#673AB7',
  },
  subsidyDetailsValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#512DA8',
  },
  warningCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderColor: '#FFECB3',
    borderWidth: 1,
    borderRadius: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8F00',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#664D03',
    lineHeight: 20,
  },
});
