'use client';

import { useState } from 'react';
import { AuthorizedPersonnelData, FormMessage, AuthorizedPersonnel } from '@/types/admin';
import { ValidationUtils, AdminFirestoreService } from '@/lib/adminUtils';

interface UsePersonnelManagementReturn {
  formData: AuthorizedPersonnelData;
  isLoading: boolean;
  message: FormMessage | null;
  personnel: AuthorizedPersonnel[];
  updateFormField: (field: keyof AuthorizedPersonnelData, value: string) => void;
  addPersonnel: () => Promise<void>;
  fetchPersonnel: () => Promise<void>;
  clearMessage: () => void;
  resetForm: () => void;
}

const initialFormData: AuthorizedPersonnelData = {
  militaryPersonalNumber: '',
  firstName: '',
  lastName: '',
  rank: '',
  phoneNumber: ''
};

export function usePersonnelManagement(): UsePersonnelManagementReturn {
  const [formData, setFormData] = useState<AuthorizedPersonnelData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [personnel, setPersonnel] = useState<AuthorizedPersonnel[]>([]);

  const updateFormField = (field: keyof AuthorizedPersonnelData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear message when user types
    if (message) {
      setMessage(null);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setMessage(null);
  };

  const validateForm = (): boolean => {
    const validation = ValidationUtils.validateAuthorizedPersonnelData(formData);
    
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setMessage({
        text: firstError,
        type: 'error'
      });
      return false;
    }

    return true;
  };

  const addPersonnel = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await AdminFirestoreService.addAuthorizedPersonnel(formData);

      if (result.success) {
        setMessage({
          text: result.message,
          type: 'success'
        });
        resetForm();

        // Refresh personnel list
        await fetchPersonnel();
      } else {
        setMessage({
          text: result.message,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error adding personnel:', error);
      setMessage({
        text: 'Failed to add personnel. Please try again.',
        type: 'error'
      });
    }

    setIsLoading(false);
  };

  const fetchPersonnel = async () => {
    setIsLoading(true);

    try {
      const fetchedPersonnel = await AdminFirestoreService.getAllAuthorizedPersonnel();
      setPersonnel(fetchedPersonnel);
    } catch (error) {
      console.error('Error fetching personnel:', error);
      setMessage({
        text: 'Failed to fetch personnel list.',
        type: 'error'
      });
    }

    setIsLoading(false);
  };

  const clearMessage = () => {
    setMessage(null);
  };

  const addPersonnelBulk = async (personnel: PersonnelFormData[]) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await AdminFirestoreService.addAuthorizedPersonnelBulk(personnel);
      setMessage({
        text: `Successfully added ${result.successful.length} personnel. Duplicates: ${result.duplicates.length}. Failed: ${result.failed.length}.`,
        type: 'success',
      });
    } catch {
      setMessage({
        text: 'Failed to add personnel in bulk. Please try again.',
        type: 'error',
      });
    }

    setIsLoading(false);
  };

  return {
    formData,
    isLoading,
    message,
    personnel,
    updateFormField,
    resetForm,
    addPersonnel,
    fetchPersonnel,
    clearMessage
  };
}
