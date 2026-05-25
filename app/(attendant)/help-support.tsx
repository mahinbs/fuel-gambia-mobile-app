import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.ATTENDANT;

export default function HelpSupportScreen() {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      Alert.alert('Validation Error', 'Please enter your message.');
      return;
    }
    setSubmitting(true);
    // Simulate API call to save feedback
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert('Thank You', 'Your message has been submitted to support. We will get back to you shortly.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 1000);
  };

  const faqs = [
    {
      q: 'How do I dispense fuel using a QR code?',
      a: 'Go to the home tab, click the "Scanner" button, position the customer\'s QR code within the frame, confirm the transaction details on the next screen, and click "Confirm & Mark Done".',
    },
    {
      q: 'What should I do if a QR code is invalid?',
      a: 'Ask the customer to refresh their screen or verify that they have enough allocated liters. Make sure they are using a fresh code generated in their app.',
    },
    {
      q: 'How do I record a cash sale?',
      a: 'Go to the home tab, click "Cash Sales", select the fuel type (Petrol/Diesel), input the cash amount in GMD, and tap "Record Sale". This will automatically update your station\'s stock.',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Help & Support</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <Card key={index} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submit Support Request</Text>
          <Card style={styles.feedbackCard}>
            <Text style={styles.feedbackLabel}>Message</Text>
            <TextInput
              style={styles.input}
              placeholder="Describe your issue or ask a question..."
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              placeholderTextColor="#8E8E93"
            />
            <Button
              title="Submit Request"
              onPress={handleSubmitFeedback}
              loading={submitting}
              style={styles.submitButton}
            />
          </Card>
        </View>
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
    marginBottom: 32,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  faqCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  feedbackCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  feedbackLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
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
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.primary,
  },
});
