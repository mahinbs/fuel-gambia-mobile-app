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
import { useAuthStore, useCustomerStore } from '../../store';
import { QRCode } from '../../components/QRCode';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UserRole, TransactionMode } from '../../types';
import { generateQRData } from '../../utils/qr';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLOR_THEMES } from '../../utils/constants';
import { Clipboard } from '../../utils/clipboard';

const theme = COLOR_THEMES.USER;

export default function QRCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ qrId?: string }>();
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
    if (currentPaymentIntent?.id && !params.qrId) {
      hasGeneratedRef.current = false;
    }
  }, [currentPaymentIntent?.id, params.qrId]);

  useEffect(() => {
    if (!hasGeneratedRef.current && !params.qrId) {
      generateQR();
      hasGeneratedRef.current = true;
    }
  }, [user, currentPaymentIntent, params.qrId]);

  const generateQR = () => {
    if (!user) {
      console.log('Missing user');
      return;
    }

    // Generate QR from payment intent (paid purchase)
    if (currentPaymentIntent && currentPaymentIntent.status === 'SUCCESS') {
      const transactionId = currentPaymentIntent.transactionId || `TXN-${Date.now()}`;
      const payload = {
        transactionId: transactionId,
        fuelType: currentPaymentIntent.fuelType,
        paidAmount: currentPaymentIntent.amount,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        mode: TransactionMode.PAID,
      };
      const qrString = generateQRData(payload);
      console.log('Generated paid QR code');
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Paid Fuel QR Code</Text>
          <TouchableOpacity
            style={styles.scannerButton}
            onPress={handleScanQR}
          >
            <Ionicons name="scan" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <Card style={styles.qrCard}>
          <QRCode payload={qrPayload} size={250} />
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.infoValue}>
              {formatCurrency(currentPaymentIntent?.amount || 0)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fuel Type</Text>
            <Text style={styles.infoValue}>
              {currentPaymentIntent?.fuelType || 'PETROL'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expires</Text>
            <Text style={styles.infoValue}>
              {formatDate(
                new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              )}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mode</Text>
            <Text style={styles.infoValue}>PAID</Text>
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
  emptyActions: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    width: '100%',
  },
});
