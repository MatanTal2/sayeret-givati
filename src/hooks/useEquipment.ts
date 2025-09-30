'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Equipment, 
  EquipmentType, 
  EquipmentStatus, 
  EquipmentCondition,
  EquipmentAction,
  ApprovalType
} from '@/types/equipment';
import { EquipmentService } from '@/lib/equipmentService';
import { TEXT_CONSTANTS } from '@/constants/text';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';

// Equipment Hook Interface
interface UseEquipmentReturn {
  // Equipment Items
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
  
  // Equipment Types
  equipmentTypes: EquipmentType[];
  typesLoading: boolean;
  typesError: string | null;
  
  // Equipment Items Operations
  refreshEquipment: () => Promise<void>;
  addEquipment: (equipmentData: Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>, signedBy: string) => Promise<boolean>;
  transferEquipment: (equipmentId: string, newHolder: string, newHolderId: string, updatedBy: string, updatedByName: string, newUnit?: string, newLocation?: string, notes?: string) => Promise<boolean>;
  updateEquipmentStatus: (equipmentId: string, newStatus: EquipmentStatus, updatedBy: string, updatedByName: string, notes?: string) => Promise<boolean>;
  updateEquipmentCondition: (equipmentId: string, newCondition: EquipmentCondition, updatedBy: string, updatedByName: string, notes?: string) => Promise<boolean>;
  performDailyCheck: (equipmentId: string, checkedBy: string, checkedByName: string, notes?: string) => Promise<boolean>;
  
  // Equipment Types Operations
  refreshEquipmentTypes: () => Promise<void>;
  addEquipmentType: (equipmentTypeData: Omit<EquipmentType, 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  
  // Utility Functions
  getEquipmentById: (equipmentId: string) => Equipment | undefined;
  getEquipmentByStatus: (status: EquipmentStatus) => Equipment[];
  getEquipmentByCondition: (condition: EquipmentCondition) => Equipment[];
  getEquipmentByHolder: (holder: string) => Equipment[];
  getEquipmentByUnit: (unit: string) => Equipment[];
  getEquipmentTypeById: (typeId: string) => EquipmentType | undefined;
}

export function useEquipment(): UseEquipmentReturn {
  // Equipment Items State
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Equipment Types State
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);

  /**
   * Load equipment items from Firestore
   */
  const refreshEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await EquipmentService.Items.getEquipmentList();
      
      if (result.success) {
        setEquipment(result.equipments);
      } else {
        setError(result.error || TEXT_CONSTANTS.FEATURES.EQUIPMENT.ERROR_LOADING);
        setEquipment([]);
      }
    } catch (err) {
      console.error('Error loading equipment:', err);
      setError(TEXT_CONSTANTS.ERRORS.CONNECTION_ERROR);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load equipment types from Firestore
   */
  const refreshEquipmentTypes = useCallback(async () => {
    setTypesLoading(true);
    setTypesError(null);
    
    try {
      const result = await EquipmentService.Types.getEquipmentTypes();
      
      if (result.success) {
        setEquipmentTypes(result.equipmentTypes);
      } else {
        setTypesError(result.error || TEXT_CONSTANTS.FEATURES.EQUIPMENT.ERROR_LOADING);
        setEquipmentTypes([]);
      }
    } catch (err) {
      console.error('Error loading equipment types:', err);
      setTypesError(TEXT_CONSTANTS.ERRORS.CONNECTION_ERROR);
      setEquipmentTypes([]);
    } finally {
      setTypesLoading(false);
    }
  }, []);

  /**
   * Add new equipment item
   */
  const addEquipment = useCallback(async (
    equipmentData: Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>,
    signedBy: string
  ): Promise<boolean> => {
    try {
      const result = await EquipmentService.Items.createEquipment(
        equipmentData,
        equipmentData.currentHolder, // Display name
        equipmentData.currentHolderId, // User UID
        signedBy,
        TEXT_CONSTANTS.FEATURES.EQUIPMENT.INITIAL_SIGN_IN
      );

      if (result.success) {
        // Refresh equipment list
        await refreshEquipment();
        return true;
      } else {
        setError(result.message);
        return false;
      }
    } catch (err) {
      console.error('Error adding equipment:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, [refreshEquipment]);

  /**
   * Transfer equipment to new holder
   */
  const transferEquipment = useCallback(async (
    equipmentId: string,
    newHolder: string,
    newHolderId: string,
    updatedBy: string,
    updatedByName: string,
    newUnit?: string,
    newLocation?: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      // For now, use a basic approval (in production, this would involve the notification system)
      const approvalDetails = {
        approvedBy: updatedBy,
        approvedAt: serverTimestamp() as Timestamp,
        approvalType: ApprovalType.NO_APPROVAL_REQUIRED
      };

      const result = await EquipmentService.Items.transferEquipment(
        equipmentId,
        newHolder,
        newHolderId,
        updatedBy,
        updatedByName,
        approvalDetails,
        newUnit,
        newLocation,
        notes
      );

      if (result.success) {
        // Refresh equipment list
        await refreshEquipment();
        return true;
      } else {
        setError(result.message);
        return false;
      }
    } catch (err) {
      console.error('Error transferring equipment:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, [refreshEquipment]);

  /**
   * Update equipment status
   */
  const updateEquipmentStatus = useCallback(async (
    equipmentId: string,
    newStatus: EquipmentStatus,
    updatedBy: string,
    updatedByName: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const result = await EquipmentService.Items.updateEquipment(
        equipmentId,
        { status: newStatus },
        updatedBy,
        updatedByName,
        EquipmentAction.STATUS_UPDATE,
        notes
      );

      if (result.success) {
        // Refresh equipment list
        await refreshEquipment();
        return true;
      } else {
        setError(result.message);
        return false;
      }
    } catch (err) {
      console.error('Error updating equipment status:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, [refreshEquipment]);

  /**
   * Update equipment condition
   */
  const updateEquipmentCondition = useCallback(async (
    equipmentId: string,
    newCondition: EquipmentCondition,
    updatedBy: string,
    updatedByName: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const result = await EquipmentService.Items.updateEquipment(
        equipmentId,
        { condition: newCondition },
        updatedBy,
        updatedByName,
        EquipmentAction.CONDITION_UPDATE,
        notes
      );

      if (result.success) {
        // Refresh equipment list
        await refreshEquipment();
        return true;
      } else {
        setError(result.message);
        return false;
      }
    } catch (err) {
      console.error('Error updating equipment condition:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, [refreshEquipment]);

  /**
   * Perform daily check-in
   */
  const performDailyCheck = useCallback(async (
    equipmentId: string,
    checkedBy: string,
    checkedByName: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const result = await EquipmentService.Items.updateEquipment(
        equipmentId,
        { lastReportUpdate: serverTimestamp() as Timestamp },
        checkedBy,
        checkedByName,
        EquipmentAction.DAILY_CHECK_IN,
        notes || TEXT_CONSTANTS.FEATURES.EQUIPMENT.DAILY_CHECK
      );

      if (result.success) {
        // Refresh equipment list
        await refreshEquipment();
        return true;
      } else {
        setError(result.message);
        return false;
      }
    } catch (err) {
      console.error('Error performing daily check:', err);
      setError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, [refreshEquipment]);

  /**
   * Add new equipment type
   */
  const addEquipmentType = useCallback(async (
    equipmentTypeData: Omit<EquipmentType, 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    try {
      const result = await EquipmentService.Types.createEquipmentType(equipmentTypeData);

      if (result.success) {
        // Refresh equipment types list
        await refreshEquipmentTypes();
        return true;
      } else {
        setTypesError(result.message);
        return false;
      }
    } catch (err) {
      console.error('Error adding equipment type:', err);
      setTypesError(TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR);
      return false;
    }
  }, [refreshEquipmentTypes]);

  // Utility Functions
  const getEquipmentById = useCallback((equipmentId: string): Equipment | undefined => {
    return equipment.find(item => item.id === equipmentId);
  }, [equipment]);

  const getEquipmentByStatus = useCallback((status: EquipmentStatus): Equipment[] => {
    return equipment.filter(item => item.status === status);
  }, [equipment]);

  const getEquipmentByCondition = useCallback((condition: EquipmentCondition): Equipment[] => {
    return equipment.filter(item => item.condition === condition);
  }, [equipment]);

  const getEquipmentByHolder = useCallback((holder: string): Equipment[] => {
    return equipment.filter(item => item.currentHolder === holder);
  }, [equipment]);

  const getEquipmentByUnit = useCallback((unit: string): Equipment[] => {
    return equipment.filter(item => item.assignedUnit === unit);
  }, [equipment]);

  const getEquipmentTypeById = useCallback((typeId: string): EquipmentType | undefined => {
    return equipmentTypes.find(type => type.id === typeId);
  }, [equipmentTypes]);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('🔍 AUTH: User authenticated, loading equipment data');
        refreshEquipment();
        refreshEquipmentTypes();
      } else {
        console.log('🔍 AUTH: No user authenticated, clearing equipment data');
        setEquipment([]);
        setEquipmentTypes([]);
      }
    });

    return () => unsubscribe();
  }, [refreshEquipment, refreshEquipmentTypes]);

  return {
    // Equipment Items
    equipment,
    loading,
    error,
    
    // Equipment Types
    equipmentTypes,
    typesLoading,
    typesError,
    
    // Equipment Items Operations
    refreshEquipment,
    addEquipment,
    transferEquipment,
    updateEquipmentStatus,
    updateEquipmentCondition,
    performDailyCheck,
    
    // Equipment Types Operations
    refreshEquipmentTypes,
    addEquipmentType,
    
    // Utility Functions
    getEquipmentById,
    getEquipmentByStatus,
    getEquipmentByCondition,
    getEquipmentByHolder,
    getEquipmentByUnit,
    getEquipmentTypeById
  };
}