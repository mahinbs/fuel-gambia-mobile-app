import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAttendantStore } from '../../store';
import { parseQRData, isQRExpired } from '../../utils/qr';
import { Loading } from '../../components/ui/Loading';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.ATTENDANT;

// Web version - manual QR input
function WebQRScanner() {
  const router = useRouter();
  const { scanQR } = useAttendantStore();
  const [manualQRInput, setManualQRInput] = useState('');

  const handleManualInput = () => {
    if (manualQRInput.trim()) {
      const parsed = parseQRData(manualQRInput.trim());
      if (!parsed) {
        Alert.alert('Error', 'Invalid QR code');
        return;
      }
      if (isQRExpired(parsed.expiry)) {
        Alert.alert('Error', 'QR code has expired');
        return;
      }
      scanQR(parsed);
      router.push('/(attendant)/coupon-validation');
    } else {
      Alert.alert('Error', 'Please enter QR code data');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.webContainer}>
        <Card style={styles.webCard}>
          <Ionicons name="qr-code-outline" size={64} color={theme.primary} />
          <Text style={styles.webTitle}>QR Code Scanner</Text>
          <Text style={styles.webSubtitle}>
            Camera scanning is not available on web. Please enter the QR code data manually.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Paste QR code data here"
            value={manualQRInput}
            onChangeText={setManualQRInput}
            multiline
            numberOfLines={4}
            placeholderTextColor="#8E8E93"
          />
          <Button
            title="Validate QR Code"
            onPress={handleManualInput}
            style={styles.submitButton}
          />
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            style={styles.backButton}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
}

// Native version - will only be used on native platforms
function NativeQRScanner() {
  const router = useRouter();
  const { scanQR } = useAttendantStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [cameraModule, setCameraModule] = useState<any>(null);

  // Load camera module
  useEffect(() => {
    try {
      const module = require('react-native-vision-camera');
      setCameraModule(module);
    } catch (error) {
      console.warn('VisionCamera not available:', error);
      setHasPermission(false);
    }
  }, []);

  const handleQRScan = (data: string) => {
    const parsed = parseQRData(data);
    if (!parsed) {
      Alert.alert('Error', 'Invalid QR code');
      return;
    }

    if (isQRExpired(parsed.expiry)) {
      Alert.alert('Error', 'QR code has expired');
      return;
    }

    scanQR(parsed);
    router.push('/(attendant)/coupon-validation');
  };

  // Use hooks - must be called unconditionally
  // Since this component only renders on native, it's safe to call hooks
  // If module isn't loaded yet, hooks will be undefined and we'll handle that
  const device = cameraModule?.useCameraDevice ? cameraModule.useCameraDevice('back') : null;
  
  const codeScanner = cameraModule?.useCodeScanner ? cameraModule.useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes: any) => {
      if (codes && codes.length > 0) {
        const qrData = codes[0]?.value;
        if (qrData && qrData !== scannedData) {
          setScannedData(qrData);
          handleQRScan(qrData);
        }
      }
    },
  }) : null;
  
  const Camera = cameraModule?.Camera || null;

  useEffect(() => {
    if (Camera) {
      checkPermission();
    } else if (cameraModule === null) {
      // Still loading
      return;
    } else {
      setHasPermission(false);
    }
  }, [Camera, cameraModule]);

  const checkPermission = async () => {
    if (!Camera) {
      setHasPermission(false);
      return;
    }
    try {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(false);
    }
  };

  if (cameraModule === null) {
    return <Loading />;
  }

  if (hasPermission === null) {
    return <Loading />;
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#8E8E93" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={checkPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device || !Camera) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
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
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Main component - conditionally render based on platform
export default function QRScannerScreen() {
  if (Platform.OS === 'web') {
    return <WebQRScanner />;
  }
  return <NativeQRScanner />;
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
    alignItems: 'center',
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
});
