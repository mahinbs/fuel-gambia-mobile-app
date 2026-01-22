import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/constants';

export default function BeneficiarySelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fromSignup?: string }>();
  const fromSignup = params.fromSignup === 'true';
  const { user, setUser } = useAuthStore();
  const [isBeneficiary, setIsBeneficiary] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (beneficiary: boolean) => {
    setIsBeneficiary(beneficiary);
  };

  const handleContinue = async () => {
    if (isBeneficiary === null) return;
    if (!user) {
      console.error('User is null, cannot proceed');
      Alert.alert('Error', 'User data not found. Please try logging in again.');
      return;
    }

    setLoading(true);
    try {
      // Update user with beneficiary status
      const updatedUser = {
        ...user,
        isBeneficiary: Boolean(isBeneficiary), // Ensure it's a boolean
      };
      
      // Update both store and storage - ensure data is persisted
      setUser(updatedUser);
      Storage.set(STORAGE_KEYS.USER_DATA, updatedUser);

      // Verify the data was saved
      const savedUser = Storage.get<any>(STORAGE_KEYS.USER_DATA);
      if (!savedUser || savedUser.isBeneficiary !== Boolean(isBeneficiary)) {
        console.warn('User data may not have been saved correctly, retrying...');
        // Retry saving
        Storage.set(STORAGE_KEYS.USER_DATA, updatedUser);
      }

      // Small delay to ensure state is updated and storage is flushed
      await new Promise(resolve => setTimeout(resolve, 300));

      // Navigate based on selection and flow type
      if (isBeneficiary) {
        if (fromSignup) {
          // Signup flow: beneficiaries need to upload documents
          // Use replace to prevent back navigation issues
          try {
            // Add a small delay before navigation to ensure everything is ready
            await new Promise(resolve => setTimeout(resolve, 100));
            router.replace('/(beneficiary)/document-upload');
          } catch (navError) {
            console.error('Navigation to document-upload failed:', navError);
            // Fallback to dashboard with error handling
            try {
              router.replace('/(beneficiary)/dashboard');
            } catch (fallbackError) {
              console.error('Fallback navigation failed:', fallbackError);
              // Last resort - go to home
              router.replace('/');
            }
          }
        } else {
          // Login flow: beneficiaries go directly to dashboard
          try {
            router.replace('/(beneficiary)/dashboard');
          } catch (navError) {
            console.error('Navigation to dashboard failed:', navError);
            router.replace('/');
          }
        }
      } else {
        // Regular users go to customer dashboard
        try {
          router.replace('/(customer)/dashboard');
        } catch (navError) {
          console.error('Navigation to customer dashboard failed:', navError);
          router.replace('/');
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert(
        'Error',
        'Failed to update your information. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Fallback navigation on error
              try {
                if (isBeneficiary) {
                  router.replace('/(beneficiary)/dashboard');
                } else {
                  router.replace('/(customer)/dashboard');
                }
              } catch (navError) {
                console.error('Navigation error:', navError);
                router.replace('/');
              }
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={48} color="#007AFF" />
          </View>
          <Text style={styles.title}>Are you a Fuel Beneficiary?</Text>
          <Text style={styles.subtitle}>
            Government employees can access subsidized fuel allocations
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSelect(true)}
            activeOpacity={0.7}
          >
            <Card
              style={[
                styles.card,
                isBeneficiary === true && styles.cardSelected,
              ]}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.radioCircle,
                    isBeneficiary === true && styles.radioCircleSelected,
                  ]}
                >
                  {isBeneficiary === true && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.optionText}>
                  <Ionicons
                    name="shield-checkmark"
                    size={32}
                    color={isBeneficiary === true ? '#007AFF' : '#8E8E93'}
                  />
                  <Text
                    style={[
                      styles.optionTitle,
                      isBeneficiary === true && styles.optionTitleSelected,
                    ]}
                  >
                    Yes, I'm a Beneficiary
                  </Text>
                  <Text style={styles.optionSubtitle}>
                    Access subsidized fuel allocations and government benefits
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSelect(false)}
            activeOpacity={0.7}
          >
            <Card
              style={[
                styles.card,
                isBeneficiary === false && styles.cardSelected,
              ]}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.radioCircle,
                    isBeneficiary === false && styles.radioCircleSelected,
                  ]}
                >
                  {isBeneficiary === false && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.optionText}>
                  <Ionicons
                    name="person"
                    size={32}
                    color={isBeneficiary === false ? '#007AFF' : '#8E8E93'}
                  />
                  <Text
                    style={[
                      styles.optionTitle,
                      isBeneficiary === false && styles.optionTitleSelected,
                    ]}
                  >
                    No, Regular User
                  </Text>
                  <Text style={styles.optionSubtitle}>
                    Purchase fuel with standard payment methods
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          loading={loading}
          disabled={isBeneficiary === null}
          style={styles.continueButton}
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
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  optionCard: {
    marginBottom: 8,
  },
  card: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  cardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#007AFF',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  continueButton: {
    marginTop: 8,
  },
});
