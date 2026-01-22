import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCodeSVG from 'react-native-qrcode-svg';
import { QRPayload } from '../types';
import { generateQRData } from '../utils/qr';

interface QRCodeProps {
  payload: QRPayload;
  size?: number;
}

export const QRCode: React.FC<QRCodeProps> = ({ payload, size = 200 }) => {
  const qrData = generateQRData(payload);

  return (
    <View style={styles.container}>
      <QRCodeSVG value={qrData} size={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
