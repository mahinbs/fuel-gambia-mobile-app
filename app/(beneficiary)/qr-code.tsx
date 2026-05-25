import React, { useEffect, useState, useRef } from 'react';
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
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useBeneficiaryStore } from '../../store';
import { QRCode } from '../../components/QRCode';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UserRole, TransactionMode } from '../../types';
import { generateQRData } from '../../utils/qr';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLOR_THEMES, FUEL_PRICES } from '../../utils/constants';
import { Clipboard } from '../../utils/clipboard';
import { supabase } from '../../utils/supabase';

const theme = COLOR_THEMES.BENEFICIARY;

export default function QRCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ qrId?: string; success?: string }>();
  const { user } = useAuthStore();
  const { beneficiary, currentPaymentIntent, fetchBeneficiary, isLoading, saveQRCode, qrCodes } = useBeneficiaryStore();
  const [qrData, setQrData] = useState<string>('');
  const [qrPayload, setQrPayload] = useState<any>(null);
  const [isUsed, setIsUsed] = useState(false);
  const hasGeneratedRef = useRef(false);

  // Prevent navigation away from QR code screen
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Screen loses focus
      };
    }, [])
  );

  useEffect(() => {
    fetchBeneficiary();
  }, []);

  // Poll status from database if qrId is provided
  useEffect(() => {
    if (params.qrId) {
      const checkStatus = async () => {
        try {
          const { data: tx, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('qr_code', params.qrId)
            .single();

          if (tx) {
            if (tx.status === 'SUCCESS') {
              setIsUsed(true);
            }
            
            setQrPayload({
              transactionId: tx.id,
              qrCodeToken: tx.qr_code,
              userId: tx.user_id,
              fuelType: tx.fuel_type,
              paidAmount: Number(tx.amount || 0),
              remainingAmount: Number(tx.liters || 0),
              expiry: new Date(new Date(tx.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
              mode: tx.mode,
              paymentMethod: tx.payment_method,
            });
            setQrData(tx.qr_code);
            hasGeneratedRef.current = true;
          }
        } catch (err) {
          console.error('Error fetching transaction status:', err);
        }
      };

      checkStatus();
      const interval = setInterval(checkStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [params.qrId]);

  useEffect(() => {
    // If we have a local qrId, find it in local store as fallback
    if (params.qrId && qrCodes.length > 0 && !qrPayload) {
      const savedQR = qrCodes.find(qr => qr.id === params.qrId);
      if (savedQR) {
        setQrData(savedQR.qrData);
        setQrPayload(savedQR.payload);
        if (savedQR.status === 'USED' || savedQR.status === 'COMPLETE') {
          setIsUsed(true);
        }
        hasGeneratedRef.current = true;
      }
    }
  }, [params.qrId, qrCodes, qrPayload]);

  useEffect(() => {
    if (currentPaymentIntent && !params.qrId) {
      hasGeneratedRef.current = false;
    }
  }, [currentPaymentIntent?.id, params.qrId]);

  useEffect(() => {
    // Generate default QR when user is available and no qrId exists
    if (user && !hasGeneratedRef.current && !params.qrId) {
      const timer = setTimeout(() => {
        generateDefaultQR();
        hasGeneratedRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, beneficiary, currentPaymentIntent, params.qrId]);

  const generateDefaultQR = () => {
    if (!user) return;

    if (currentPaymentIntent && currentPaymentIntent.status === 'SUCCESS') {
      const payload = {
        transactionId: currentPaymentIntent.transactionId || `TXN-${Date.now()}`,
        fuelType: currentPaymentIntent.fuelType,
        paidAmount: currentPaymentIntent.amount,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        mode: TransactionMode.PAID as const,
        paymentMethod: currentPaymentIntent.paymentMethod || 'WALLET',
      };
      const qrString = generateQRData(payload as any);
      setQrData(qrString);
      setQrPayload(payload);
      
      if (saveQRCode) {
        saveQRCode({
          id: payload.transactionId,
          qrData: qrString,
          payload: payload,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        });
      }
      return;
    }

    if (user.role === UserRole.USER) {
      const userId = beneficiary?.id || (user as any).id || user.phoneNumber || '1';
      const couponId = `COUPON-${Date.now()}`;
      const payload = {
        userId: userId,
        couponId: couponId,
        fuelType: beneficiary?.fuelType || 'PETROL',
        remainingAmount: beneficiary?.remainingBalance ?? 0,
        expiry: beneficiary?.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        mode: TransactionMode.SUBSIDY as const,
        paymentMethod: 'COUPON',
      };
      const qrString = generateQRData(payload as any);
      setQrData(qrString);
      setQrPayload(payload);
      
      if (saveQRCode) {
        saveQRCode({
          id: couponId,
          qrData: qrString,
          payload: payload,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        });
      }
      return;
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(qrData);
      Alert.alert('Copied', 'QR code token copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      Alert.alert('Error', 'Failed to copy QR code data');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="qr-code-outline" size={64} color={theme.primary} />
          <Text style={styles.emptyTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || user.role !== UserRole.USER) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="qr-code-outline" size={64} color={theme.primary} />
          <Text style={styles.emptyTitle}>Access Denied</Text>
          <Text style={styles.emptyText}>This page is only available for users.</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" style={styles.backButton} />
        </View>
      </SafeAreaView>
    );
  }

  if (isUsed) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.successContainer}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark-circle" size={80} color="#34C759" />
            </View>
            <Text style={styles.successTitle}>Fuel Provided Successfully!</Text>
            <Text style={styles.successText}>
              The pump attendant has completed the transaction and dispensed the fuel.
            </Text>
            
            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fuel Type</Text>
                <Text style={styles.infoValue}>{qrPayload?.fuelType}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quantity Dispensed</Text>
                <Text style={styles.infoValue}>{qrPayload?.remainingAmount || qrPayload?.paidAmount / (FUEL_PRICES as any)[qrPayload?.fuelType]} L</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mode of Payment</Text>
                <Text style={styles.infoValue}>
                  {qrPayload?.mode === 'SUBSIDY' ? 'Allocated Fuel Quota' : 'Paid Purchase'}
                </Text>
              </View>
            </Card>

            <Button
              title="Return to Dashboard"
              onPress={() => router.replace('/(beneficiary)/dashboard')}
              style={{ width: '100%' }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {qrPayload?.mode === 'PAID' ? 'Paid Fuel QR Code' : 'Subsidized Fuel QR Code'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {params.success === 'true' && (
          <Card style={styles.successBannerCard}>
            <View style={styles.successBannerContent}>
              <Ionicons name="checkmark-circle" size={40} color="#34C759" />
              <View style={styles.successBannerTextContainer}>
                <Text style={styles.successBannerTitle}>Purchase Request Successful!</Text>
                <Text style={styles.successBannerMessage}>
                  Your fuel voucher QR code has been generated. Present this to the attendant to dispense fuel.
                </Text>
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.qrCard}>
          <QRCode payload={qrPayload} size={250} />
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.buySummaryTitle}>Buy Summary</Text>
          <View style={styles.buySummaryDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Allocated Volume</Text>
            <Text style={styles.infoValue}>
              {qrPayload?.mode === 'PAID'
                ? `${(qrPayload.paidAmount / (FUEL_PRICES as any)[qrPayload.fuelType]).toFixed(2)} L`
                : `${qrPayload?.remainingAmount || 0} L`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Equivalent GMD Value</Text>
            <Text style={styles.infoValue}>
              {formatCurrency(
                qrPayload?.mode === 'PAID'
                  ? qrPayload.paidAmount
                  : (qrPayload?.remainingAmount || 0) * (FUEL_PRICES as any)[qrPayload?.fuelType || 'PETROL']
              )}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fuel Type</Text>
            <Text style={styles.infoValue}>{qrPayload?.fuelType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mode of Payment</Text>
            <Text style={styles.infoValue}>
              {qrPayload?.mode === 'SUBSIDY' ? 'Allocated Fuel Quota (Subsidy)' : 'Paid Purchase'}
            </Text>
          </View>
          {beneficiary?.departmentName ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{beneficiary.departmentName}</Text>
            </View>
          ) : null}
          {beneficiary?.governmentId ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Government ID</Text>
              <Text style={styles.infoValue}>{beneficiary.governmentId}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expires</Text>
            <Text style={styles.infoValue}>{formatDate(qrPayload?.expiry || new Date().toISOString())}</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button title="Copy QR Code Token" onPress={handleCopy} variant="outline" style={{ width: '100%' }} />
          <Button title="Return to Dashboard" onPress={() => router.replace('/(beneficiary)/dashboard')} style={{ width: '100%', backgroundColor: theme.primary }} />
        </View>

        <Card style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Present this QR code to the station attendant.{'\n'}
            2. The attendant will scan and verify details (liters, department, subsidy).{'\n'}
            3. Once fuel is dispensed, the attendant will mark the scan complete, automatically updating your quota.
          </Text>
        </Card>
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
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  qrCard: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoCard: {
    width: '100%',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  instructionsCard: {
    width: '100%',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  successBannerCard: {
    width: '100%',
    padding: 16,
    backgroundColor: '#E8F8F5',
    borderColor: '#A3E4D7',
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 20,
  },
  successBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successBannerTextContainer: {
    flex: 1,
  },
  successBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#117A65',
    marginBottom: 4,
  },
  successBannerMessage: {
    fontSize: 13,
    color: '#16A085',
    lineHeight: 18,
  },
  buySummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
  },
  buySummaryDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginBottom: 16,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    width: '100%',
  },
  successCircle: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
});
