import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { beneficiaryService } from '../../services/beneficiaryService';
import { documentUploadSchema } from '../../utils/validation';
import { useBeneficiaryStore } from '../../store';

type UploadFormData = z.infer<typeof documentUploadSchema>;

export default function DocumentUploadScreen() {
  const router = useRouter();
  const { fetchBeneficiary } = useBeneficiaryStore();
  const [loading, setLoading] = useState(false);
  const [governmentIdUri, setGovernmentIdUri] = useState<string>('');
  const [employmentLetterUri, setEmploymentLetterUri] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<UploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    mode: 'onChange',
    defaultValues: {
      governmentId: '',
      employmentLetter: '',
      departmentName: '',
    },
  });

  // Request permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        if (Platform.OS !== 'web') {
          try {
            // Check current permission status first
            const currentStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
            if (currentStatus.status === 'granted') {
              setPermissionGranted(true);
              return;
            }

            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                'Permission Required',
                'We need access to your photo library to upload documents. Please enable it in your device settings.',
                [
                  { text: 'Cancel', style: 'cancel', onPress: () => setPermissionGranted(false) },
                  { 
                    text: 'OK', 
                    onPress: async () => {
                      try {
                        const retryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        setPermissionGranted(retryStatus.status === 'granted');
                      } catch (retryError) {
                        console.error('Error retrying permission request:', retryError);
                        setPermissionGranted(false);
                      }
                    }
                  },
                ]
              );
              setPermissionGranted(false);
            } else {
              setPermissionGranted(true);
            }
          } catch (permissionError) {
            console.error('Error requesting permissions:', permissionError);
            // Don't block the user - allow them to try uploading anyway
            setPermissionGranted(false);
            Alert.alert(
              'Permission Error',
              'There was an issue requesting permissions. You can still try to upload documents.',
              [{ text: 'OK' }]
            );
          }
        } else {
          setPermissionGranted(true);
        }
      } catch (error) {
        console.error('Error in permission request flow:', error);
        // Don't block the user - allow them to try uploading anyway
        setPermissionGranted(false);
      }
    };

    requestPermissions();
  }, []);

  const pickImage = async (type: 'governmentId' | 'employmentLetter') => {
    try {
      // Check permissions again before picking
      if (Platform.OS !== 'web') {
        try {
          const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (newStatus !== 'granted') {
              Alert.alert(
                'Permission Denied',
                'Please grant photo library access in your device settings to upload documents.',
                [{ text: 'OK' }]
              );
              return;
            }
          }
        } catch (permError) {
          console.error('Permission check error:', permError);
          Alert.alert(
            'Permission Error',
            'Unable to check permissions. Please try again or check your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          allowsMultipleSelection: false,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const uri = result.assets[0].uri;
          if (type === 'governmentId') {
            setGovernmentIdUri(uri);
          } else {
            setEmploymentLetterUri(uri);
          }
        }
      } catch (pickerError) {
        console.error('Image picker error:', pickerError);
        Alert.alert(
          'Error',
          pickerError instanceof Error ? pickerError.message : 'Failed to open image picker. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to pick image. Please try again.'
      );
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    // Validate that both documents are uploaded
    if (!governmentIdUri || !employmentLetterUri) {
      Alert.alert('Error', 'Please upload both documents');
      return;
    }

    // Validate department name
    if (!data.departmentName || data.departmentName.trim().length < 2) {
      Alert.alert('Error', 'Please enter a valid department name (at least 2 characters)');
      return;
    }

    setLoading(true);
    try {
      const success = await beneficiaryService.uploadDocuments({
        governmentId: governmentIdUri,
        employmentLetter: employmentLetterUri,
        departmentName: data.departmentName.trim(),
      });

      if (success) {
        // Refresh beneficiary data to get updated verification status
        try {
          await fetchBeneficiary();
        } catch (fetchError) {
          console.error('Error fetching beneficiary after upload:', fetchError);
        }
        
        // Small delay before navigation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Directly redirect to verification status page (KYC Verification pending)
        try {
          router.replace('/(beneficiary)/verification-status');
        } catch (navError) {
          console.error('Navigation error:', navError);
          // Fallback to dashboard
          router.replace('/(beneficiary)/dashboard');
        }
      } else {
        Alert.alert('Error', 'Failed to upload documents. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Upload Documents</Text>
        <Text style={styles.subtitle}>
          Please upload your government ID and employment letter
        </Text>

        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Government ID</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage('governmentId')}
          >
            {governmentIdUri ? (
              <View style={styles.uploadedContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#5AC8FA" />
                <Text style={styles.uploadedText}>Document uploaded</Text>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="document-attach" size={32} color="#8E8E93" />
                <Text style={styles.uploadText}>Tap to upload</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Employment Letter</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage('employmentLetter')}
          >
            {employmentLetterUri ? (
              <View style={styles.uploadedContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#5AC8FA" />
                <Text style={styles.uploadedText}>Document uploaded</Text>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="document-attach" size={32} color="#8E8E93" />
                <Text style={styles.uploadText}>Tap to upload</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Controller
          control={control}
          name="departmentName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Department Name"
              placeholder="Enter your department"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.departmentName?.message}
            />
          )}
        />

        <Button
          title="Submit Documents"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={loading || !governmentIdUri || !employmentLetterUri || !permissionGranted}
          style={styles.submitButton}
        />
        
        {!permissionGranted && (
          <Text style={styles.permissionWarning}>
            Please grant photo library access to upload documents.
          </Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  uploadSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadedText: {
    fontSize: 14,
    color: '#5AC8FA',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
  },
  permissionWarning: {
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
});
