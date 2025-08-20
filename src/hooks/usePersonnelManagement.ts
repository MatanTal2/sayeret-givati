'use client';

import { useState, useCallback } from 'react';
import { AuthorizedPersonnelData, FormMessage, AuthorizedPersonnel, PersonnelFormData, PersonnelOperationResult } from '@/types/admin';
import { ValidationUtils, AdminFirestoreService } from '@/lib/adminUtils';
import { PersonnelCache } from '@/lib/personnelCache';
import { TEXT_CONSTANTS } from '@/constants/text';

interface UsePersonnelManagementReturn {
  formData: AuthorizedPersonnelData;
  isLoading: boolean;
  message: FormMessage | null;
  personnel: AuthorizedPersonnel[];
  updateFormField: (field: keyof AuthorizedPersonnelData, value: string) => void;
  addPersonnel: () => Promise<void>;
  addPersonnelBulk: (personnel: PersonnelFormData[]) => Promise<void>;
  updatePersonnel: (personnelId: string, updateData: {
    firstName?: string;
    lastName?: string;
    rank?: string;
    phoneNumber?: string;
    userType?: string;
  }) => Promise<PersonnelOperationResult>;
  deletePersonnel: (personnelId: string) => Promise<void>;
  fetchPersonnel: (forceRefresh?: boolean) => Promise<void>;
  clearMessage: () => void;
  resetForm: () => void;
  cacheInfo: {
    isValid: boolean;
    ageInHours: number;
    lastManualRefresh: Date | null;
  };
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

  const fetchPersonnel = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedData = PersonnelCache.getCachedData();
        if (cachedData) {
          setPersonnel(cachedData.data);
          setMessage({
            text: TEXT_CONSTANTS.CONFIRMATIONS.PERSONNEL_DATA_CACHED_MESSAGE,
            type: 'info'
          });
          setIsLoading(false);
          return;
        }
      }

      // Fetch from database
      const fetchedPersonnel = await AdminFirestoreService.getAllAuthorizedPersonnel();
      setPersonnel(fetchedPersonnel);
      
      // Cache the fresh data
      PersonnelCache.setCachedData(fetchedPersonnel, forceRefresh);
      
      // Show appropriate message
      if (forceRefresh) {
        setMessage({
          text: TEXT_CONSTANTS.CONFIRMATIONS.PERSONNEL_DATA_REFRESHED_MESSAGE,
          type: 'success'
        });
      } else {
        setMessage({
          text: TEXT_CONSTANTS.CONFIRMATIONS.PERSONNEL_CACHE_EXPIRED_MESSAGE,
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error fetching personnel:', error);
      setMessage({
        text: 'Failed to fetch personnel list.',
        type: 'error'
      });
    }

    setIsLoading(false);
  }, []); // Empty dependency array since it doesn't depend on any props/state

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

  const updatePersonnel = async (
    personnelId: string, 
    updateData: {
      firstName?: string;
      lastName?: string;
      rank?: string;
      phoneNumber?: string;
      userType?: string;
    }
  ): Promise<PersonnelOperationResult> => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await AdminFirestoreService.updateAuthorizedPersonnel(personnelId, updateData);

      if (result.success) {
        setMessage({
          text: result.message,
          type: 'success'
        });

        // Refresh personnel list to get updated data
        await fetchPersonnel();
      } else {
        setMessage({
          text: result.message,
          type: 'error'
        });
      }

      setIsLoading(false);
      return result;

    } catch (error) {
      console.error('Error updating personnel:', error);
      const errorResult: PersonnelOperationResult = {
        success: false,
        message: 'Failed to update personnel. Please try again.',
        error: error instanceof Error ? error : new Error('Unknown error')
      };

      setMessage({
        text: errorResult.message,
        type: 'error'
      });

      setIsLoading(false);
      return errorResult;
    }
  };

  const deletePersonnel = async (personnelId: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await AdminFirestoreService.deleteAuthorizedPersonnel(personnelId);

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

  // Get cache information
  const cacheInfo = {
    isValid: PersonnelCache.isCacheValid(),
    ageInHours: PersonnelCache.getCacheAge(),
    lastManualRefresh: PersonnelCache.getLastManualRefresh()
  };

  return {
    formData,
    isLoading,
    message,
    personnel,
    updateFormField,
    resetForm,
    addPersonnel,
    addPersonnelBulk,
    updatePersonnel,
    deletePersonnel,
    fetchPersonnel,
    clearMessage,
    cacheInfo
  };
}
