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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCustomerStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.USER;

export default function PaymentScreen() {
  const router = useRouter();
  const { currentPaymentIntent, processPayment, clearPaymentIntent, isLoading } =
    useCustomerStore();
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  if (!currentPaymentIntent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No payment intent found</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    const success = await processPayment(selectedMethod);
    if (success) {
      // Don't clear payment intent yet - keep it for QR code generation
      // Navigate directly to QR code page
      router.replace('/(customer)/qr-code');
    } else {
      Alert.alert('Error', 'Payment failed. Please try again.');
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
          <Text style={styles.amountValue}>
            {formatCurrency(currentPaymentIntent.amount)}
          </Text>
          <Text style={styles.fuelType}>
            {currentPaymentIntent.fuelType}
          </Text>
        </Card>

        <View style={styles.paymentMethodsSection}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethodCard,
                selectedMethod === method.id && styles.paymentMethodCardActive,
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={styles.paymentMethodContent}>
                <Ionicons
                  name={method.icon as any}
                  size={24}
                  color={selectedMethod === method.id ? theme.primary : '#8E8E93'}
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    selectedMethod === method.id && styles.paymentMethodTextActive,
                  ]}
                >
                  {method.name}
                </Text>
              </View>
              {selectedMethod === method.id && (
                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title={`Pay ${formatCurrency(currentPaymentIntent.amount)}`}
          onPress={handlePayment}
          loading={isLoading}
          disabled={!selectedMethod}
          style={styles.payButton}
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
