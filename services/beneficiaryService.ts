import { apiClient } from './api';
import { Beneficiary, VerificationStatus, Transaction } from '../types';
import { Storage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';

export const beneficiaryService = {
  async getBeneficiaryData(): Promise<Beneficiary | null> {
    // Mock implementation
    // Check if documents have been uploaded (stored in storage)
    // For new beneficiaries, return PENDING status instead of null
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // Get user data to check if they are a beneficiary
          const userData = Storage.get<any>(STORAGE_KEYS.USER_DATA);
          
          // If user data doesn't exist, return null
          if (!userData) {
            console.warn('No user data found in storage');
            resolve(null);
            return;
          }

          // Check if user is a beneficiary - handle multiple formats
          // Check for boolean true, string 'true', number 1, or string '1'
          const isBeneficiary = 
            userData.isBeneficiary === true || 
            userData.isBeneficiary === 'true' || 
            userData.isBeneficiary === 1 ||
            userData.isBeneficiary === '1' ||
            String(userData.isBeneficiary).toLowerCase() === 'true';
          
          if (!isBeneficiary) {
            console.log('User is not a beneficiary:', userData.isBeneficiary);
            resolve(null);
            return;
          }

          // Check if documents were uploaded
          const hasUploadedDocs = Storage.get<boolean>('beneficiary_docs_uploaded') === true;
          
          // Check verification status
          let verificationStatus = VerificationStatus.PENDING;
          if (hasUploadedDocs) {
            const storedStatus = Storage.get<VerificationStatus>('beneficiary_verification_status');
            verificationStatus = storedStatus || VerificationStatus.PENDING;
          }

          // Return beneficiary data even if docs aren't uploaded yet
          // This allows users to see the dashboard and upload documents
          const beneficiaryData = {
            id: userData.id || userData.userId || String(Date.now()),
            phoneNumber: userData.phoneNumber || userData.phone || '+2201234567',
            role: 'BENEFICIARY' as any,
            name: userData.name || userData.fullName || 'Beneficiary',
            verificationStatus: verificationStatus,
            monthlyAllocation: verificationStatus === VerificationStatus.APPROVED ? 2000 : 0,
            remainingBalance: verificationStatus === VerificationStatus.APPROVED ? 1500 : 0,
            fuelType: 'PETROL' as any,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: userData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          console.log('Returning beneficiary data:', beneficiaryData);
          resolve(beneficiaryData);
        } catch (error) {
          console.error('Error getting beneficiary data:', error);
          // Try to return basic beneficiary data if user is marked as beneficiary
          try {
            const userData = Storage.get<any>(STORAGE_KEYS.USER_DATA);
            if (userData && (userData.isBeneficiary === true || userData.isBeneficiary === 'true' || userData.isBeneficiary === 1)) {
              const fallbackData = {
                id: userData.id || userData.userId || String(Date.now()),
                phoneNumber: userData.phoneNumber || userData.phone || '+2201234567',
                role: 'BENEFICIARY' as any,
                name: userData.name || userData.fullName || 'Beneficiary',
                verificationStatus: VerificationStatus.PENDING,
                monthlyAllocation: 0,
                remainingBalance: 0,
                fuelType: 'PETROL' as any,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: userData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              resolve(fallbackData);
              return;
            }
          } catch (fallbackError) {
            console.error('Fallback error:', fallbackError);
          }
          resolve(null);
        }
      }, 100); // Reduced timeout for faster response
    });

    // Real implementation:
    // const response = await apiClient.get<Beneficiary>('/beneficiary');
    // return response.success && response.data ? response.data : null;
  },

  async uploadDocuments(data: {
    governmentId: string;
    employmentLetter: string;
    departmentName: string;
  }): Promise<boolean> {
    // Mock implementation - sets status to PENDING after upload
    return new Promise((resolve) => {
      setTimeout(() => {
        // Store flags in storage for demo purposes
        Storage.set('beneficiary_docs_uploaded', true);
        Storage.set('beneficiary_verification_status', VerificationStatus.PENDING);
        // In real app, this would make an API call
        resolve(true);
      }, 2000);
    });

    // Real implementation:
    // const formData = new FormData();
    // formData.append('governmentId', data.governmentId);
    // formData.append('employmentLetter', data.employmentLetter);
    // formData.append('departmentName', data.departmentName);
    // const response = await apiClient.post('/beneficiary/documents', formData);
    // return response.success;
  },

  async verifyBeneficiary(): Promise<boolean> {
    // Mock implementation - manually verify the beneficiary
    return new Promise((resolve) => {
      setTimeout(() => {
        // Update verification status to APPROVED
        Storage.set('beneficiary_verification_status', VerificationStatus.APPROVED);
        resolve(true);
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.post('/beneficiary/verify');
    // return response.success;
  },

  async getTransactions(): Promise<Transaction[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            userId: '1',
            stationId: 'station1',
            stationName: 'Shell Station',
            fuelType: 'PETROL' as any,
            amount: 500,
            liters: 7.69,
            mode: 'SUBSIDY' as any,
            status: 'SUCCESS' as any,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 500);
    });

    // Real implementation:
    // const response = await apiClient.get<Transaction[]>('/beneficiary/transactions');
    // return response.success && response.data ? response.data : [];
  },
};
