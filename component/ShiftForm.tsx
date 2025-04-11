import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { createPlan } from '@/firebase/functions';
import Toast from 'react-native-toast-message';
import useStore from '@/hooks/store';

interface FormData {
  name: string;
  description: string;
  duration: string;
  amount: string;
}

interface FormErrors {
  name?: string;
  duration?: string;
  amount?: string;
}

export default function ShiftForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    duration: '',
    amount: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = useStore((state: any) => state.currentUser);
  const activeLibrary = useStore((state: any) => state.activeLibrary);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
      isValid = false;
    }

    if (!formData.duration.trim()) {
      newErrors.duration = 'Duration is required';
      isValid = false;
    } else if (isNaN(Number(formData.duration)) || Number(formData.duration) <= 0) {
      newErrors.duration = 'Duration must be a positive number';
      isValid = false;
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
      isValid = false;
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please check the form for errors',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createPlan({ data: formData, currentUser, libraryId: activeLibrary.id });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Plan created successfully',
        position: 'top',
        visibilityTime: 3000,
      });

      setFormData({
        name: '',
        description: '',
        duration: '',
        amount: '',
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error creating plan:', error);
      
      let errorMessage = 'An error occurred while creating the plan';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        switch (error.code) {
          case 'permission-denied':
            errorMessage = 'You do not have permission to create plans';
            break;
          case 'unavailable':
            errorMessage = 'Service is currently unavailable. Please try again later';
            break;
          default:
            errorMessage = `Error: ${error.code}`;
        }
      }

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.header}>Create a New Plan</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Plan Name"
            value={formData.name}
            onChangeText={(text) => {
              setFormData({ ...formData, name: text });
              if (errors.name) {
                setErrors({ ...errors, name: undefined });
              }
            }}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Optional description"
            multiline
            numberOfLines={4}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Duration (in days)</Text>
          <TextInput
            style={[styles.input, errors.duration && styles.inputError]}
            placeholder="Duration in days"
            keyboardType="numeric"
            value={formData.duration}
            onChangeText={(text) => {
              setFormData({ ...formData, duration: text });
              if (errors.duration) {
                setErrors({ ...errors, duration: undefined });
              }
            }}
          />
          {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={[styles.input, errors.amount && styles.inputError]}
            placeholder="Amount"
            keyboardType="numeric"
            value={formData.amount}
            onChangeText={(text) => {
              setFormData({ ...formData, amount: text });
              if (errors.amount) {
                setErrors({ ...errors, amount: undefined });
              }
            }}
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating...' : 'Submit'}
          </Text>
        </TouchableOpacity>
        <Toast />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  formContainer: {
    padding: 20,
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#334155',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#02c39a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
