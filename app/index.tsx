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
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect based on user role and beneficiary status
  if (user.role === UserRole.USER) {
    // Basic verification check
    if (!user.name || !user.phoneNumber) {
       // Should not happen if initialized from auth, but protect against incomplete profiles
       return <Redirect href="/(auth)/signup" />;
    }

    // Check if beneficiary status is set
    // Note: beneficiary-selection appears in login flow after OTP verification
    if (user.isBeneficiary === undefined) {
      // Fallback: go to customer dashboard
      return <Redirect href="/(customer)/dashboard" />;
    }
    // Redirect based on beneficiary status
    if (user.isBeneficiary) {
      // For beneficiaries, check verification status
      if (!beneficiary) {
        return <Redirect href="/(beneficiary)/dashboard" />;
      }
      
      // Check verification status
      if (beneficiary.verificationStatus === VerificationStatus.APPROVED) {
        return <Redirect href="/(beneficiary)/dashboard" />;
      } else if (beneficiary.verificationStatus === VerificationStatus.PENDING) {
        return <Redirect href="/(beneficiary)/verification-status" />;
      } else if (beneficiary.verificationStatus === VerificationStatus.REJECTED) {
        return <Redirect href="/(beneficiary)/verification-status" />;
      } else {
        return <Redirect href="/(beneficiary)/dashboard" />;
      }
    } else {
      // Regular user - go to customer dashboard
      return <Redirect href="/(customer)/dashboard" />;
    }
  } else if (user.role === UserRole.ATTENDANT) {
    return <Redirect href="/(attendant)/dashboard" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
