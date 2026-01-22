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
import { COLOR_THEMES } from '../../utils/constants';
import { Clipboard } from '../../utils/clipboard';

const theme = COLOR_THEMES.BENEFICIARY;

export default function QRCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ qrId?: string }>();
  const { user } = useAuthStore();
  const { beneficiary, currentPaymentIntent, fetchBeneficiary, isLoading, saveQRCode, qrCodes } = useBeneficiaryStore();
  const [qrData, setQrData] = useState<string>('');
  const [qrPayload, setQrPayload] = useState<any>(null);
  const hasGeneratedRef = useRef(false);

  // Prevent navigation away from QR code screen
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - keep it visible
      return () => {
        // Screen loses focus - but don't navigate away automatically
      };
    }, [])
  );

  useEffect(() => {
    // Always fetch beneficiary data on mount, but don't redirect
    fetchBeneficiary();
  }, []);

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
    // Reset generation flag when payment intent changes
    if (currentPaymentIntent && !params.qrId) {
      hasGeneratedRef.current = false;
    }
  }, [currentPaymentIntent?.id, params.qrId]);

  useEffect(() => {
    // Generate QR when user is available, but only once per payment intent
    if (user && !hasGeneratedRef.current && !params.qrId) {
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        generateQR();
        hasGeneratedRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, beneficiary, currentPaymentIntent, params.qrId]);

  const generateQR = () => {
    if (!user) {
      return;
    }

    // Check if there's a payment intent (paid purchase)
    if (currentPaymentIntent && currentPaymentIntent.status === 'SUCCESS') {
      const payload = {
        transactionId: currentPaymentIntent.transactionId || `TXN-${Date.now()}`,
        fuelType: currentPaymentIntent.fuelType,
        paidAmount: currentPaymentIntent.amount,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        mode: TransactionMode.PAID,
      };
      const qrString = generateQRData(payload);
      setQrData(qrString);
      setQrPayload(payload);
      
      // Save QR code with pending status
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

    // Generate from beneficiary balance (even if 0, for testing)
    if (user.role === UserRole.USER) {
      // Use beneficiary data if available, otherwise use defaults
      const userId = beneficiary?.id || (user as any).id || user.phoneNumber || '1';
      const couponId = `COUPON-${Date.now()}`;
      const payload = {
        userId: userId,
        couponId: couponId,
        fuelType: beneficiary?.fuelType || 'PETROL',
        remainingAmount: beneficiary?.remainingBalance ?? 0,
        expiry: beneficiary?.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        mode: TransactionMode.SUBSIDY,
      };
      const qrString = generateQRData(payload);
      setQrData(qrString);
      setQrPayload(payload);
      
      // Save QR code with pending status
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

  // Only block if user is not a USER role
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

  // Show warning if balance is 0 but still allow QR generation
  const hasBalance = (beneficiary?.remainingBalance ?? 0) > 0;
  const showBalanceWarning = !hasBalance && !currentPaymentIntent;

  if (!qrData || !qrPayload) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.emptyContainer}>
            <Ionicons name="qr-code-outline" size={64} color={theme.primary} />
            <Text style={styles.emptyTitle}>Generating QR Code...</Text>
            <Text style={styles.emptyText}>
              {!user ? 'Loading user data...' : !beneficiary ? 'Loading beneficiary data...' : 'Preparing QR code...'}
            </Text>
            <View style={styles.emptyActions}>
              <Button
                title="Generate QR Code"
                onPress={generateQR}
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {currentPaymentIntent && currentPaymentIntent.status === 'SUCCESS'
              ? 'Paid Fuel QR Code'
              : 'Subsidized Fuel QR Code'}
          </Text>
          <TouchableOpacity
            style={styles.scannerButton}
            onPress={handleScanQR}
          >
            <Ionicons name="scan" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {showBalanceWarning && (
          <Card style={[styles.warningCard, { backgroundColor: '#FFF3CD', borderColor: '#FF9500' }]}>
            <View style={styles.warningContent}>
              <Ionicons name="information-circle" size={20} color="#FF9500" />
              <View style={styles.warningText}>
                <Text style={styles.warningTitle}>Zero Balance</Text>
                <Text style={styles.warningMessage}>
                  Your balance is zero. You can still generate a QR code, but you'll need to purchase fuel first.
                </Text>
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.qrCard}>
          <QRCode payload={qrPayload} size={250} />
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.infoValue}>
              {formatCurrency(
                currentPaymentIntent && currentPaymentIntent.status === 'SUCCESS'
                  ? currentPaymentIntent.amount
                  : (beneficiary?.remainingBalance ?? 0)
              )}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fuel Type</Text>
            <Text style={styles.infoValue}>
              {currentPaymentIntent && currentPaymentIntent.status === 'SUCCESS'
                ? currentPaymentIntent.fuelType
                : (beneficiary?.fuelType || 'PETROL')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expires</Text>
            <Text style={styles.infoValue}>
              {formatDate(
                currentPaymentIntent && currentPaymentIntent.status === 'SUCCESS'
                  ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                  : (beneficiary?.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
              )}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mode</Text>
            <Text style={styles.infoValue}>
              {currentPaymentIntent && currentPaymentIntent.status === 'SUCCESS'
                ? 'PAID'
                : 'SUBSIDY'}
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Copy QR Data"
            onPress={handleCopy}
            variant="outline"
            style={{ width: '100%' }}
          />
          <Button
            title="Scan QR Code"
            onPress={handleScanQR}
            style={{ width: '100%', backgroundColor: theme.primary }}
          />
          <Button
            title="Regenerate"
            onPress={generateQR}
            variant="secondary"
            style={{ width: '100%' }}
          />
        </View>

        <Card style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to use</Text>
          <Text style={styles.instructionsText}>
            1. Show this QR code to the fuel station attendant{'\n'}
            2. The attendant will scan the code{'\n'}
            3. Select the amount of fuel to dispense{'\n'}
            4. Receive your fuel and receipt
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
  scannerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningCard: {
    width: '100%',
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  qrCard: {
    marginBottom: 24,
    padding: 20,
  },
  infoCard: {
    width: '100%',
    marginBottom: 24,
    padding: 20,
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
  },
  instructionsTitle: {
    fontSize: 18,
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
  emptyActions: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    width: '100%',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  backButton: {
    marginTop: 16,
  },
});
