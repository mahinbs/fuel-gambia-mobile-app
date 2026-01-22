import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role: string }>();
  const role = params.role || '';

  const getOnboardingContent = () => {
    switch (role) {
      case 'USER':
        return {
          title: 'Welcome to Fuel Gambia!',
          steps: [
            {
              icon: 'cart',
              title: 'Purchase Fuel',
              description: 'Select fuel type and amount',
            },
            {
              icon: 'card',
              title: 'Make Payment',
              description: 'Pay securely using mobile money or card',
            },
            {
              icon: 'qr-code',
              title: 'Get QR Code',
              description: 'Receive QR code after successful payment',
            },
            {
              icon: 'car',
              title: 'Redeem at Station',
              description: 'Show QR code at any fuel station',
            },
          ],
        };
      case 'ATTENDANT':
        return {
          title: 'Welcome, Station Attendant!',
          steps: [
            {
              icon: 'scan',
              title: 'Scan QR Codes',
              description: 'Use camera to scan customer QR codes',
            },
            {
              icon: 'checkmark-circle',
              title: 'Validate Coupon',
              description: 'Verify QR code validity and expiry',
            },
            {
              icon: 'water',
              title: 'Dispense Fuel',
              description: 'Enter amount and dispense fuel',
            },
            {
              icon: 'receipt',
              title: 'Generate Receipt',
              description: 'Create transaction receipt for customer',
            },
          ],
        };
      default:
        return { title: 'Welcome!', steps: [] };
    }
  };

  const content = getOnboardingContent();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>
            Follow these simple steps to get started
          </Text>
        </View>

        <View style={styles.stepsContainer}>
          {content.steps.map((step, index) => (
            <Card key={index} style={styles.stepCard}>
              <View style={styles.stepContent}>
                <View style={styles.stepIcon}>
                  <Ionicons name={step.icon as any} size={32} color="#007AFF" />
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
            </Card>
          ))}
        </View>

        <Button
          title="Continue"
          onPress={() => router.push({
            pathname: '/(auth)/login',
            params: { fromSignup: 'true' }
          })}
          style={styles.button}
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
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  stepCard: {
    padding: 20,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    marginRight: 16,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  button: {
    marginTop: 16,
  },
});
