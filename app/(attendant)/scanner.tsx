import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAttendantStore } from '../../store';
import { parseQRData, isQRExpired } from '../../utils/qr';
import { Loading } from '../../components/ui/Loading';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { COLOR_THEMES } from '../../utils/constants';
import { supabase } from '../../utils/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';

const theme = COLOR_THEMES.ATTENDANT;

export default function QRScannerScreen() {
  const router = useRouter();
  const { scanQR } = useAttendantStore();
  const [isLoading, setIsLoading] = useState(false);
  const [manualQRInput, setManualQRInput] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const processScannedToken = async (token: string) => {
    if (!token || token.trim() === '') {
      Alert.alert('Validation Error', 'Please enter a valid QR token.');
      return;
    }
    setIsLoading(true);
    try {
      // 1. Check if token is JSON string (legacy mock support)
      if (token.trim().startsWith('{')) {
        const parsed = parseQRData(token.trim());
        if (!parsed) {
          Alert.alert('Error', 'Invalid QR code format');
          setIsLoading(false);
          setScanned(false);
          return;
        }
        if (isQRExpired(parsed.expiry)) {
          Alert.alert('Error', 'QR code has expired');
          setIsLoading(false);
          setScanned(false);
          return;
        }
        scanQR(parsed);
        setIsLoading(false);
        router.push('/(attendant)/coupon-validation');
        return;
      }

      // 2. Fetch live pending transaction from database
      const { data: tx, error } = await supabase
        .from('transactions')
        .select('*, profiles:user_id(name, role, department_name, government_id)')
        .eq('qr_code', token.trim())
        .single();

      if (error || !tx) {
        Alert.alert('Error', 'Transaction QR Code not found in database');
        setIsLoading(false);
        setScanned(false);
        return;
      }

      if (tx.status !== 'PENDING') {
        Alert.alert('Invalid QR Code', `This transaction is already ${tx.status.toLowerCase()}`);
        setIsLoading(false);
        setScanned(false);
        return;
      }

      // Map to scanned QR payload format
      const payload = {
        transactionId: tx.id,
        qrCodeToken: tx.qr_code,
        userId: tx.user_id,
        userName: (tx.profiles as any)?.name || 'Unknown User',
        userType: (tx.profiles as any)?.role === 'BENEFICIARY' ? 'BENEFICIARY' : 'NORMAL',
        fuelType: tx.fuel_type,
        paidAmount: Number(tx.amount || 0),
        remainingAmount: Number(tx.liters || 0),
        expiry: new Date(new Date(tx.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        mode: tx.mode,
        paymentMethod: tx.payment_method,
        departmentName: (tx.profiles as any)?.department_name || '',
        governmentId: (tx.profiles as any)?.government_id || '',
      };

      scanQR(payload as any);
      setIsLoading(false);
      router.push('/(attendant)/coupon-validation');
    } catch (err) {
      console.error('Scan validation error:', err);
      Alert.alert('Error', 'Failed to validate QR code from database');
      setIsLoading(false);
      setScanned(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || isLoading) return;
    setScanned(true);
    processScannedToken(data);
  };

  // Render manual input for Web or when selected
  if (Platform.OS === 'web' || showManual) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : (
            <Card style={styles.webCard}>
              <Ionicons name="qr-code-outline" size={64} color={theme.primary} />
              <Text style={styles.webTitle}>Validate QR Code</Text>
              <Text style={styles.webSubtitle}>
                Enter the QR code token or paste JSON data below.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Paste QR code token (e.g. QR_SUBSIDY_...) or JSON data"
                value={manualQRInput}
                onChangeText={setManualQRInput}
                multiline
                numberOfLines={4}
                placeholderTextColor="#8E8E93"
              />
              <Button
                title="Validate QR Code"
                onPress={() => processScannedToken(manualQRInput)}
                style={styles.submitButton}
              />
              <Button
                title="Go Back"
                onPress={() => {
                  if (showManual && Platform.OS !== 'web') {
                    setShowManual(false);
                  } else {
                    router.back();
                  }
                }}
                variant="outline"
                style={styles.backButton}
              />
            </Card>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Camera permissions states
  if (!permission) {
    return <Loading />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#8E8E93" />
          <Text style={styles.permissionText}>Camera permission required to scan QR codes</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.permissionButton, { marginTop: 16, backgroundColor: '#8E8E93' }]} 
            onPress={() => setShowManual(true)}
          >
            <Text style={styles.permissionButtonText}>Use Manual Code Entry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Verifying QR Code...</Text>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <Text style={styles.instructionText}>
              Position QR code within the frame
            </Text>
          </View>
        </View>
      )}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.closeButton, { marginLeft: 16, width: 'auto', paddingHorizontal: 16, borderRadius: 28 }]} 
          onPress={() => setShowManual(true)}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Manual Entry</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFFFFF',
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    top: 'auto',
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  cornerBottomRight: {
    top: 'auto',
    bottom: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 40,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  closeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  permissionText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  webCard: {
    width: '100%',
    maxWidth: 500,
    padding: 24,
    alignItems: 'center',
  },
  webTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  webSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    width: '100%',
    marginBottom: 12,
  },
  backButton: {
    width: '100%',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    gap: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
