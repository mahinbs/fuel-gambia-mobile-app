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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBeneficiaryStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.BENEFICIARY;

export default function BeneficiaryPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount: string; fuelType: string }>();
  const {
    beneficiary,
    updateBalance,
    currentPaymentIntent,
    createPaymentIntent,
    processPayment,
    isLoading,
  } = useBeneficiaryStore();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [useBalance, setUseBalance] = useState<boolean>(false);
  const [processing, setProcessing] = useState(false);

  const amount = parseFloat(params.amount || '0');
  const fuelType = (params.fuelType as 'PETROL' | 'DIESEL') || 'PETROL';
  const hasBalance = beneficiary && beneficiary.remainingBalance > 0;
  const canDeductFromBalance = hasBalance && amount <= beneficiary.remainingBalance;
  const remainingAfterDeduction = hasBalance
    ? beneficiary.remainingBalance - amount
    : 0;

  useEffect(() => {
    // Create payment intent
    if (amount > 0 && !currentPaymentIntent && !isLoading) {
      createPaymentIntent(amount, fuelType);
    }
  }, [amount, fuelType]);

  if (!beneficiary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No beneficiary data found</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show loading while payment intent is being created
  if (isLoading && !currentPaymentIntent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Preparing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Only show error if payment intent creation failed and we're not loading
  if (!currentPaymentIntent || amount <= 0) {
    if (!isLoading) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Invalid payment amount</Text>
            <Button
              title="Go Back"
              onPress={() => router.back()}
              style={styles.backButton}
            />
          </View>
        </SafeAreaView>
      );
    }
    return null;
  }

  const handlePayment = async () => {
    if (useBalance && canDeductFromBalance) {
      // Deduct from balance
      updateBalance(amount);
      // Create QR code directly
      // Use push instead of replace to avoid tab navigation issues
      router.push({
        pathname: '/(beneficiary)/qr-code',
        params: {
          amount: amount.toString(),
          fuelType,
          fromBalance: 'true',
        },
      });
    } else {
      // Process payment
      if (!selectedMethod) {
        Alert.alert('Error', 'Please select a payment method');
        return;
      }

      setProcessing(true);
      const success = await processPayment(selectedMethod);
      setProcessing(false);

      if (success) {
        // Navigate to QR code page - it will use the payment intent
        // Use push instead of replace to avoid tab navigation issues
        router.push('/(beneficiary)/qr-code');
      } else {
        Alert.alert('Error', 'Payment failed. Please try again.');
      }
    }
  };

  const paymentMethods = [
    { id: 'mobile_money', name: 'Mobile Money', icon: 'phone-portrait' },
    { id: 'card', name: 'Debit/Credit Card', icon: 'card' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: 'business' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Payment</Text>

        <Card style={[styles.amountCard, { backgroundColor: theme.primary }]}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
          <Text style={styles.fuelType}>{fuelType}</Text>
        </Card>

        {hasBalance && canDeductFromBalance && (
          <Card style={styles.balanceOptionCard}>
            <TouchableOpacity
              style={styles.balanceOption}
              onPress={() => setUseBalance(!useBalance)}
            >
              <View style={styles.balanceOptionContent}>
                <View
                  style={[
                    styles.radioCircle,
                    useBalance && styles.radioCircleSelected,
                  ]}
                >
                  {useBalance && <View style={styles.radioInner} />}
                </View>
                <View style={styles.balanceOptionText}>
                  <Text style={styles.balanceOptionTitle}>
                    Use Beneficiary Balance
                  </Text>
                  <Text style={styles.balanceOptionSubtitle}>
                    Deduct {formatCurrency(amount)} from your allocated balance
                    {'\n'}
                    Remaining: {formatCurrency(remainingAfterDeduction)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Card>
        )}

        {(!useBalance || !canDeductFromBalance) && (
          <>
            <View style={styles.paymentMethodsSection}>
              <Text style={styles.sectionTitle}>Select Payment Method</Text>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethodCard,
                    selectedMethod === method.id &&
                      styles.paymentMethodCardActive,
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <View style={styles.paymentMethodContent}>
                    <Ionicons
                      name={method.icon as any}
                      size={24}
                      color={
                        selectedMethod === method.id ? theme.primary : '#8E8E93'
                      }
                    />
                    <Text
                      style={[
                        styles.paymentMethodText,
                        selectedMethod === method.id &&
                          styles.paymentMethodTextActive,
                      ]}
                    >
                      {method.name}
                    </Text>
                  </View>
                  {selectedMethod === method.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Button
          title={
            useBalance && canDeductFromBalance
              ? `Use Balance (${formatCurrency(amount)})`
              : `Pay ${formatCurrency(amount)}`
          }
          onPress={handlePayment}
          loading={processing || isLoading}
          disabled={!useBalance && !selectedMethod}
          style={styles.payButton}
        />
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
    marginBottom: 24,
  },
  amountCard: {
    marginBottom: 24,
    padding: 24,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fuelType: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  balanceOptionCard: {
    marginBottom: 24,
    padding: 20,
  },
  balanceOption: {
    width: '100%',
  },
  balanceOptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  balanceOptionText: {
    flex: 1,
  },
  balanceOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  balanceOptionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  paymentMethodsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  paymentMethodCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  paymentMethodTextActive: {
    color: '#007AFF',
  },
  payButton: {
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
