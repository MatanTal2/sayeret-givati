'use client';

import { useState } from 'react';
import { PersonnelFormData, FormMessage, AuthorizedPersonnel } from '@/types/admin';
import { AdminFirestoreService, ValidationUtils } from '@/lib/adminUtils';

interface UsePersonnelManagementReturn {
  formData: PersonnelFormData;
  isLoading: boolean;
  message: FormMessage | null;
  personnel: AuthorizedPersonnel[];
  updateFormField: (field: keyof PersonnelFormData, value: string) => void;
  resetForm: () => void;
  addPersonnel: () => Promise<void>;
  fetchPersonnel: () => Promise<void>;
  deletePersonnel: (id: string) => Promise<void>;
  validateForm: () => boolean;
  clearMessage: () => void;
  addPersonnelBulk: (personnel: PersonnelFormData[]) => Promise<void>;
}

const initialFormData: PersonnelFormData = {
  militaryPersonalNumber: '',
  firstName: '',
  lastName: '',
  rank: '',
  phoneNumber: ''
};

export function usePersonnelManagement(): UsePersonnelManagementReturn {
  const [formData, setFormData] = useState<PersonnelFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [personnel, setPersonnel] = useState<AuthorizedPersonnel[]>([]);

  const updateFormField = (field: keyof PersonnelFormData, value: string) => {
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
    const validation = ValidationUtils.validatePersonnelForm(formData);

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

  const deletePersonnel = async (id: string) => {
    if (!confirm('Are you sure you want to remove this person from the authorized list?')) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await AdminFirestoreService.deleteAuthorizedPersonnel(id);

      if (result.success) {
        setMessage({
          text: result.message,
          type: 'success'
        });

        // Refresh personnel list
        await fetchPersonnel();
      } else {
        setMessage({
          text: result.message,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting personnel:', error);
      setMessage({
        text: 'Failed to delete personnel. Please try again.',
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
    deletePersonnel,
    validateForm,
    clearMessage,
    addPersonnelBulk,
  };
}
