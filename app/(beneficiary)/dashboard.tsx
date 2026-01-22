import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBeneficiaryStore, useAuthStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/format';
import { VerificationStatus } from '../../types';
import { Loading } from '../../components/ui/Loading';
import { COLOR_THEMES } from '../../utils/constants';

// Use the same color theme as attendant dashboard
const theme = COLOR_THEMES.ATTENDANT;

export default function BeneficiaryDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { beneficiary, isLoading, fetchBeneficiary, getPendingQRCodes, qrCodes } = useBeneficiaryStore();

  useEffect(() => {
    const loadBeneficiary = async () => {
      try {
        await fetchBeneficiary();
      } catch (error) {
        console.error('Error fetching beneficiary data:', error);
      }
    };
    loadBeneficiary();
  }, []);

  // Note: Document upload is only part of signup flow, not login
  // During login, if no beneficiary data exists, user can still access dashboard
  // They will see a message prompting them to complete signup if needed

  if (isLoading) {
    return <Loading />;
  }

  // If no beneficiary data but user is a beneficiary, show document upload option
  if (!beneficiary) {
    // Check if user is actually a beneficiary - handle multiple formats
    // Type assertion needed because storage might return string/number values at runtime
    const beneficiaryValue: unknown = user?.isBeneficiary;
    const isUserBeneficiary = 
      beneficiaryValue === true || 
      beneficiaryValue === 'true' || 
      beneficiaryValue === 1 ||
      beneficiaryValue === '1' ||
      String(beneficiaryValue || '').toLowerCase() === 'true';
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyText}>Complete Your Beneficiary Setup</Text>
          <Text style={styles.emptySubtext}>
            {isUserBeneficiary 
              ? 'Please upload your documents to access beneficiary features.'
              : 'Please complete your signup process to access beneficiary features.'}
          </Text>
          {isUserBeneficiary && (
            <Button
              title="Upload Documents"
              onPress={() => {
                try {
                  router.push('/(beneficiary)/document-upload');
                } catch (navError) {
                  console.error('Navigation error:', navError);
                  // Fallback navigation
                  router.replace('/(beneficiary)/document-upload');
                }
              }}
              style={styles.emptyButton}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const isPending = beneficiary.verificationStatus === VerificationStatus.PENDING;
  const isRejected = beneficiary.verificationStatus === VerificationStatus.REJECTED;
  const isApproved = beneficiary.verificationStatus === VerificationStatus.APPROVED;
  const balancePercentage = (beneficiary.remainingBalance / beneficiary.monthlyAllocation) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Pending Banner */}
        {isPending && (
          <Card style={[styles.pendingBanner, { backgroundColor: '#FFF3CD', borderColor: '#FF9500' }]}>
            <View style={styles.pendingBannerContent}>
              <Ionicons name="time" size={20} color="#FF9500" />
              <View style={styles.pendingBannerText}>
                <Text style={styles.pendingBannerTitle}>KYC Verification Pending</Text>
                <Text style={styles.pendingBannerMessage}>
                  Your documents are under review. You can still access the dashboard.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Header */}
        <View style={[styles.headerGradient, { backgroundColor: theme.primary }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back!</Text>
              <Text style={styles.userName}>{beneficiary.name || user?.name || 'Beneficiary'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/(beneficiary)/profile')}
            >
              <Ionicons name="person-circle" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.badgeContainer}>
            <View style={styles.beneficiaryBadge}>
              <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
              <Text style={styles.badgeText}>Fuel Beneficiary</Text>
            </View>
          </View>
        </View>

        {/* Verification Status Alerts */}
        {isPending && (
          <Card style={styles.alertCard}>
            <View style={styles.alertContent}>
              <View style={styles.alertIconContainer}>
                <Ionicons name="time" size={24} color="#FF9500" />
              </View>
              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>Verification Pending</Text>
                <Text style={styles.alertMessage}>
                  Your documents are under review. You'll be notified once approved.
                </Text>
              </View>
            </View>
            <Button
              title="Check Status"
              onPress={() => router.push('/(beneficiary)/verification-status')}
              variant="outline"
              size="small"
              style={styles.alertButton}
            />
          </Card>
        )}

        {isRejected && (
          <Card style={[styles.alertCard, styles.rejectedCard]}>
            <View style={styles.alertContent}>
              <View style={[styles.alertIconContainer, styles.rejectedIcon]}>
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </View>
              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>Verification Rejected</Text>
                <Text style={styles.alertMessage}>
                  Your documents were rejected. Please contact support for assistance.
                </Text>
              </View>
            </View>
            <Text style={styles.alertMessage}>
              Please contact support to resolve verification issues. Document upload is only available during signup.
            </Text>
          </Card>
        )}

        {isApproved && (
          <>
            {/* Monthly Allocation Card */}
            <Card style={[styles.allocationCard, { backgroundColor: theme.secondary }]}>
              <View style={styles.allocationHeader}>
                <View>
                  <Text style={styles.allocationLabel}>Monthly Allocation</Text>
                  <Text style={styles.allocationAmount}>
                    {formatCurrency(beneficiary.monthlyAllocation)}
                  </Text>
                </View>
                <View style={styles.allocationIconContainer}>
                  <Ionicons name="gift" size={32} color="#FFFFFF" />
                </View>
              </View>
            </Card>

            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <Card style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <View style={[styles.statIcon, { backgroundColor: theme.secondary }]}>
                    <Ionicons name="wallet" size={20} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.statLabel}>Remaining Balance</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(beneficiary.remainingBalance)}
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${balancePercentage}%`,
                          backgroundColor: balancePercentage > 50 ? theme.secondary : balancePercentage > 25 ? '#FF9500' : '#FF3B30',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {balancePercentage.toFixed(0)}% remaining
                  </Text>
                </View>
              </Card>

              <Card style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <View style={[styles.statIcon, { backgroundColor: theme.primary }]}>
                    <Ionicons 
                      name="car-sport" 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </View>
                </View>
                <Text style={styles.statLabel}>Fuel Type</Text>
                <Text style={styles.statValue}>Petrol/Diesel</Text>
                <View style={styles.fuelTypeBadge}>
                  <Ionicons
                    name="flame"
                    size={16}
                    color="#FF9500"
                  />
                  <Text style={styles.fuelTypeText}>Petrol</Text>
                  <Text style={styles.fuelTypeText}> / </Text>
                  <Ionicons
                    name="water"
                    size={16}
                    color={theme.primary}
                  />
                  <Text style={styles.fuelTypeText}>Diesel</Text>
                </View>
              </Card>
            </View>

            {/* Expiry Card */}
            <Card style={styles.expiryCard}>
              <View style={styles.expiryContent}>
                <View style={[styles.expiryIconContainer, { backgroundColor: '#F3F0FF' }]}>
                  <Ionicons name="calendar" size={24} color={theme.secondary} />
                </View>
                <View style={styles.expiryText}>
                  <Text style={styles.expiryLabel}>Allocation Expires</Text>
                  <Text style={styles.expiryDate}>
                    {formatDate(beneficiary.expiryDate)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </View>
            </Card>

            {/* QR Code Status Cards */}
            {getPendingQRCodes().length > 0 && (
              <View style={styles.qrStatusSection}>
                <Text style={styles.sectionTitle}>Pending QR Codes</Text>
                {getPendingQRCodes().slice(0, 3).map((qrCode) => (
                  <TouchableOpacity
                    key={qrCode.id}
                    onPress={() => router.push({
                      pathname: '/(beneficiary)/qr-code',
                      params: { qrId: qrCode.id }
                    })}
                    activeOpacity={0.7}
                  >
                    <Card style={styles.qrStatusCard}>
                      <View style={styles.qrStatusContent}>
                        <View style={[styles.qrStatusIconContainer, { backgroundColor: '#E3F2FD' }]}>
                          <Ionicons name="qr-code" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.qrStatusInfo}>
                          <Text style={styles.qrStatusTitle}>
                            {qrCode.payload.mode === 'PAID' ? 'Paid Fuel QR' : 'Subsidized Fuel QR'}
                          </Text>
                          <Text style={styles.qrStatusDetails}>
                            {formatCurrency(qrCode.payload.paidAmount || qrCode.payload.remainingAmount || 0)} • {qrCode.payload.fuelType}
                          </Text>
                          <Text style={styles.qrStatusDate}>
                            Created {formatDate(qrCode.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.qrStatusBadge}>
                          <View style={[styles.qrStatusDot, { backgroundColor: '#FF9500' }]} />
                          <Text style={styles.qrStatusText}>Pending</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              {beneficiary.remainingBalance > 0 && (
                <Button
                  title="Generate QR Code"
                  onPress={() => router.push('/(beneficiary)/qr-code')}
                  style={styles.qrButton}
                />
              )}
              <Button
                title="Purchase Fuel"
                onPress={() => router.push('/(beneficiary)/purchase')}
                variant={beneficiary.remainingBalance > 0 ? 'outline' : 'primary'}
                style={styles.purchaseButton}
              />
            </View>
          </>
        )}

        {!isApproved && (
          <View style={styles.quickActionsContainer}>
            <Card style={styles.infoCard}>
              <Text style={styles.infoText}>
                Document upload is only available during signup. Please contact support if you need assistance.
              </Text>
            </Card>
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.quickLinksContainer}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(beneficiary)/transactions')}
          >
            <Ionicons name="receipt" size={24} color={theme.primary} />
            <Text style={[styles.quickLinkText, { color: theme.primary }]}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(beneficiary)/qr-code')}
          >
            <Ionicons name="qr-code" size={24} color={theme.primary} />
            <Text style={[styles.quickLinkText, { color: theme.primary }]}>QR Code</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(beneficiary)/notifications')}
          >
            <Ionicons name="notifications" size={24} color={theme.primary} />
            <Text style={styles.quickLinkText}>Notifications</Text>
          </TouchableOpacity>
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
  pendingBanner: {
    margin: 20,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  pendingBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pendingBannerText: {
    flex: 1,
  },
  pendingBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 4,
  },
  pendingBannerMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  beneficiaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertCard: {
    margin: 20,
    marginTop: -15,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFF4E6',
  },
  rejectedCard: {
    backgroundColor: '#FFEBEE',
  },
  alertContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE4CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rejectedIcon: {
    backgroundColor: '#FFCDD2',
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  alertButton: {
    marginTop: 8,
  },
  allocationCard: {
    margin: 20,
    marginTop: -15,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocationLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  allocationAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  allocationIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  fuelTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  fuelTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  expiryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  expiryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  expiryText: {
    flex: 1,
  },
  expiryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  qrButton: {
    borderRadius: 16,
    marginBottom: 12,
  },
  purchaseButton: {
    borderRadius: 16,
  },
  uploadButton: {
    borderRadius: 16,
  },
  quickLinksContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  quickLink: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
  },
  infoCard: {
    padding: 16,
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  qrStatusSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  qrStatusCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
  },
  qrStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrStatusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  qrStatusInfo: {
    flex: 1,
  },
  qrStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  qrStatusDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  qrStatusDate: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  qrStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    gap: 6,
  },
  qrStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  qrStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
});
