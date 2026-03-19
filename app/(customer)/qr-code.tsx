import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useCustomerStore, useBeneficiaryStore } from '../../store';
import { QRCode } from '../../components/QRCode';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UserRole, TransactionMode } from '../../types';
import { generateQRData } from '../../utils/qr';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLOR_THEMES, FUEL_PRICES } from '../../utils/constants';
import { Clipboard } from '../../utils/clipboard';

const theme = COLOR_THEMES.USER;

export default function QRCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    qrId?: string;
    amount?: string;
    fuelType?: string;
    paymentMethod?: string;
    success?: string;
    mode?: string;
  }>();
  const { user } = useAuthStore();
  const { currentPaymentIntent, saveQRCode, qrCodes } = useCustomerStore();
  const [qrData, setQrData] = useState<string>('');
  const [qrPayload, setQrPayload] = useState<any>(null);
  const hasGeneratedRef = React.useRef(false);

  useEffect(() => {
    // Load QR code from saved data if qrId is provided
    if (params.qrId && qrCodes.length > 0) {
      const savedQR = qrCodes.find(qr => qr.id === params.qrId);
      if (savedQR) {
        setQrData(savedQR.qrData);
        setQrPayload(savedQR.payload);
        hasGeneratedRef.current = true;
        return;
      }
    }
  }, [params.qrId, qrCodes]);

  useEffect(() => {
    if ((currentPaymentIntent?.id || params.success === 'true') && !params.qrId) {
      hasGeneratedRef.current = false;
    }
  }, [currentPaymentIntent?.id, params.qrId, params.success]);

  useEffect(() => {
    if (!hasGeneratedRef.current && !params.qrId) {
      generateQR();
      hasGeneratedRef.current = true;
    }
  }, [user, currentPaymentIntent, params.qrId, params.success, params.mode]);

  const generateQR = () => {
    if (!user) {
      console.log('Missing user');
      return;
    }

    // Generate QR from payment intent or URL params (paid purchase or subsidy)
    const isSuccess = currentPaymentIntent?.status === 'SUCCESS' || params.success === 'true';
    const amount = currentPaymentIntent?.amount || parseFloat(params.amount || '0');
    const fuelType = currentPaymentIntent?.fuelType || params.fuelType || 'PETROL';
    const mode = params.mode || (currentPaymentIntent as any)?.mode || TransactionMode.PAID;
    
    if (isSuccess && amount > 0) {
      const transactionId = currentPaymentIntent?.transactionId || `TXN-${Date.now()}`;
      
      let payload: any;
      if (mode === TransactionMode.SUBSIDY || mode === 'SUBSIDY') {
        payload = {
          userId: user.id,
          userName: user.name,
          userType: 'BENEFICIARY',
          couponId: `COUPON-${Date.now()}`,
          fuelType: fuelType,
          remainingAmount: amount, // For subsidy, this is the amount being redeemed now
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          mode: TransactionMode.SUBSIDY,
        };
      } else {
        payload = {
          transactionId: transactionId,
          fuelType: fuelType,
          paidAmount: amount,
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          mode: TransactionMode.PAID,
        };
      }

      const qrString = generateQRData(payload);
      console.log('Generated QR code for mode:', mode);
      setQrData(qrString);
      setQrPayload(payload);
      
      // Save QR code with pending status
      if (saveQRCode) {
        saveQRCode({
          id: transactionId,
          qrData: qrString,
          payload: payload,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        });
      }
      return;
    }

    // No payment intent - show empty state
    setQrData('');
    setQrPayload(null);
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(qrData);
      Alert.alert('Copied', 'QR code data copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      Alert.alert('Error', 'Failed to copy QR code data');
    }
  };

  const handleScanQR = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'QR Scanner',
        'Camera scanning is not available on web. Please use the attendant scanner or enter QR code manually.',
        [{ text: 'OK' }]
      );
    } else {
      router.push('/(attendant)/scanner');
    }
  };

  if (!user || user.role !== UserRole.USER) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="qr-code-outline" size={64} color={theme.primary} />
          <Text style={styles.emptyTitle}>Access Denied</Text>
          <Text style={styles.emptyText}>
            This page is only available for users.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!qrData || !qrPayload) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.emptyContainer}>
            <Ionicons name="qr-code-outline" size={64} color={theme.primary} />
            <Text style={styles.emptyTitle}>No QR code available</Text>
            <Text style={styles.emptyText}>
              Complete a fuel purchase to generate a QR code.
            </Text>
            <View style={styles.emptyActions}>
              <Button
                title="Purchase Fuel"
                onPress={() => router.push('/(customer)/purchase')}
                style={styles.actionButton}
              />
              <Button
                title="Go Back"
                onPress={() => router.back()}
                variant="outline"
                style={styles.actionButton}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Fuel Coupon</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.qrSection}>
          <Card style={styles.qrCard}>
            <View style={styles.qrContainer}>
              <QRCode payload={qrPayload} size={240} />
            </View>
            <View style={styles.qrBadge}>
              <Ionicons name="checkmark-circle" size={18} color={theme.secondary} />
              <Text style={styles.qrBadgeText}>Valid for 24 Hours</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coupon Details</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View>
                <Text style={styles.infoLabel}>{params.mode === 'SUBSIDY' ? 'Subsidy Amount' : 'Amount Paid'}</Text>
                <Text style={styles.infoValue}>
                  {formatCurrency(currentPaymentIntent?.amount || qrPayload.paidAmount || qrPayload.remainingAmount || 0)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View>
                <Text style={styles.infoLabel}>Fuel Type</Text>
                <Text style={styles.infoValue}>
                  {currentPaymentIntent?.fuelType || qrPayload.fuelType || 'PETROL'}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRowBottom}>
              <View>
                <Text style={styles.infoLabel}>Estimated Liters</Text>
                <Text style={styles.infoValueLiters}>
                  {((currentPaymentIntent?.amount || qrPayload.paidAmount || 0) / (FUEL_PRICES as any)[currentPaymentIntent?.fuelType || qrPayload.fuelType || 'PETROL']).toFixed(2)} L
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>ACTIVE</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Card style={styles.instructionsCard}>
            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: theme.primary + '15' }]}>
                <Text style={[styles.stepNumberText, { color: theme.primary }]}>1</Text>
              </View>
              <Text style={styles.instructionText}>Show this QR code to the station attendant</Text>
            </View>
            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: theme.primary + '15' }]}>
                <Text style={[styles.stepNumberText, { color: theme.primary }]}>2</Text>
              </View>
              <Text style={styles.instructionText}>Attendant will scan and confirm the amount</Text>
            </View>
            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: theme.primary + '15' }]}>
                <Text style={[styles.stepNumberText, { color: theme.primary }]}>3</Text>
              </View>
              <Text style={styles.instructionText}>Fuel will be dispensed and receipt issued</Text>
            </View>
          </Card>
        </View>

        <View style={styles.actions}>
          <Button
            title="Download Coupon"
            onPress={() => Alert.alert('Coming Soon', 'Feature in development')}
            style={styles.actionButton}
          />
          <Button
            title="Back to Home"
            onPress={() => router.push('/(customer)/dashboard')}
            variant="outline"
            style={styles.secondaryButton}
          />
        </View>
        <View style={{ height: 40 }} />
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
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrCard: {
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  qrContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  qrBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  section: {
    marginBottom: 32,
    width: '100%',
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
    padding: 24,
    borderRadius: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  infoRowBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  infoValueLiters: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.primary,
  },
  statusBadge: {
    backgroundColor: theme.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.secondary,
  },
  instructionsCard: {
    padding: 20,
    borderRadius: 24,
    gap: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#3A3A3C',
    fontWeight: '500',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    height: 56,
    borderRadius: 16,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 500,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emptyActions: {
    width: '100%',
    gap: 12,
  },
});
