import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBeneficiaryStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { VerificationStatus } from '../../types';
import { Loading } from '../../components/ui/Loading';
import { beneficiaryService } from '../../services/beneficiaryService';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.BENEFICIARY;

export default function VerificationStatusScreen() {
  const router = useRouter();
  const { beneficiary, isLoading, fetchBeneficiary } = useBeneficiaryStore();
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchBeneficiary();
  }, []);

  // Auto-redirect to dashboard if approved
  useEffect(() => {
    if (beneficiary && beneficiary.verificationStatus === VerificationStatus.APPROVED) {
      // Small delay to show the status before redirecting
      const timer = setTimeout(() => {
        router.replace('/(beneficiary)/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [beneficiary, router]);

  if (isLoading) {
    return <Loading />;
  }

  if (!beneficiary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusConfig = () => {
    switch (beneficiary.verificationStatus) {
      case VerificationStatus.APPROVED:
        return {
          icon: 'checkmark-circle',
          color: '#5AC8FA',
          title: 'Verified',
          message: 'Your documents have been approved. You can now use your fuel allocation.',
        };
      case VerificationStatus.PENDING:
        return {
          icon: 'time',
          color: '#FF9500',
          title: 'KYC Verification Pending',
          message: 'Your documents are currently under review. This usually takes 2-3 business days.',
        };
      case VerificationStatus.REJECTED:
        return {
          icon: 'close-circle',
          color: '#FF3B30',
          title: 'Rejected',
          message: 'Your documents were rejected. Please upload new documents.',
        };
      default:
        return {
          icon: 'help-circle',
          color: '#8E8E93',
          title: 'Unknown',
          message: 'Unable to determine verification status.',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const success = await beneficiaryService.verifyBeneficiary();
      if (success) {
        // Refresh beneficiary data to get updated status
        await fetchBeneficiary();
        // Small delay to show success, then redirect
        setTimeout(() => {
          // Redirect to dashboard to show all features working
          router.replace('/(beneficiary)/dashboard');
        }, 500);
      } else {
        Alert.alert('Error', 'Failed to verify user. Please try again.');
        setVerifying(false);
      }
    } catch (error) {
      console.error('Verify error:', error);
      Alert.alert('Error', 'Failed to verify user. Please try again.');
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.statusCard}>
          <View style={styles.statusIconContainer}>
            <Ionicons name={statusConfig.icon as any} size={64} color={statusConfig.color} />
          </View>
          <Text style={styles.statusTitle}>{statusConfig.title}</Text>
          <Text style={styles.statusMessage}>{statusConfig.message}</Text>
        </Card>

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: statusConfig.color }]}>
              {beneficiary.verificationStatus}
            </Text>
          </View>
          {beneficiary.departmentName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Department</Text>
              <Text style={styles.detailValue}>{beneficiary.departmentName}</Text>
            </View>
          )}
        </Card>

        {beneficiary.verificationStatus === VerificationStatus.APPROVED && (
          <View style={styles.actionContainer}>
            <Button
              title="Go to Dashboard"
              onPress={() => router.replace('/(beneficiary)/dashboard')}
              style={styles.dashboardButton}
            />
          </View>
        )}

        {beneficiary.verificationStatus === VerificationStatus.PENDING && (
          <View style={styles.actionContainer}>
            <Text style={styles.waitingText}>
              Please wait while we review your documents. You'll be notified once verification is complete.
            </Text>
            <Button
              title="Verify"
              onPress={handleVerify}
              loading={verifying}
              style={[styles.verifyButton, { backgroundColor: theme.secondary }]}
            />
            <Button
              title="Go to Dashboard"
              onPress={() => router.replace('/(beneficiary)/dashboard')}
              style={styles.dashboardButton}
              variant="outline"
            />
          </View>
        )}

        {beneficiary.verificationStatus === VerificationStatus.REJECTED && (
          <View style={styles.actionContainer}>
            <Button
              title="Verify"
              onPress={handleVerify}
              loading={verifying}
              style={[styles.verifyButton, { backgroundColor: theme.secondary }]}
            />
            <Card style={styles.infoCard}>
              <Text style={styles.infoText}>
                Document upload is only available during signup. Please contact support for assistance with rejected documents.
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 20,
  },
  statusCard: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 24,
  },
  statusIconContainer: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  detailsCard: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  detailLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  actionContainer: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  verifyButton: {
    marginTop: 8,
  },
  dashboardButton: {
    marginTop: 12,
  },
  uploadButton: {
    marginTop: 12,
  },
  waitingText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  infoCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FFF4E6',
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});
