import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore, useBeneficiaryStore } from '../store';
import { UserRole, VerificationStatus } from '../types';
import { Loading } from '../components/ui/Loading';

export default function Index() {
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  const { beneficiary, fetchBeneficiary } = useBeneficiaryStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  // Fetch beneficiary data if user is a beneficiary
  useEffect(() => {
    if (user && user.role === UserRole.USER && user.isBeneficiary) {
      fetchBeneficiary();
    }
  }, [user]);

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/signup" />;
  }

  // Redirect based on user role and beneficiary status
  if (user.role === UserRole.USER) {
    // Check if beneficiary status is set
    // Note: beneficiary-selection appears in login flow after OTP verification
    // If isBeneficiary is undefined, it means user hasn't selected yet (shouldn't happen after login)
    // But if it does, redirect to customer dashboard as fallback
    if (user.isBeneficiary === undefined) {
      // Fallback: go to customer dashboard
      return <Redirect href="/(customer)/dashboard" />;
    }
    // Redirect based on beneficiary status
    if (user.isBeneficiary) {
      // For beneficiaries, check verification status
      // Note: Document upload is only part of signup flow, not login
      // If no beneficiary data exists during login, redirect to dashboard
      if (!beneficiary) {
        // During login, if no beneficiary data, go to dashboard
        // User can access dashboard and see their status
        return <Redirect href="/(beneficiary)/dashboard" />;
      }
      
      // Check verification status
      if (beneficiary.verificationStatus === VerificationStatus.APPROVED) {
        // Approved - can access dashboard
        return <Redirect href="/(beneficiary)/dashboard" />;
      } else if (beneficiary.verificationStatus === VerificationStatus.PENDING) {
        // Pending - allow dashboard access but show verification status page first
        return <Redirect href="/(beneficiary)/verification-status" />;
      } else if (beneficiary.verificationStatus === VerificationStatus.REJECTED) {
        // Rejected - show verification status
        return <Redirect href="/(beneficiary)/verification-status" />;
      } else {
        // Unknown status - redirect to dashboard (not document upload)
        return <Redirect href="/(beneficiary)/dashboard" />;
      }
    } else {
      // Regular user - go to customer dashboard
      return <Redirect href="/(customer)/dashboard" />;
    }
  } else if (user.role === UserRole.ATTENDANT) {
    return <Redirect href="/(attendant)/dashboard" />;
  } else {
    return <Redirect href="/(auth)/signup" />;
  }
}
