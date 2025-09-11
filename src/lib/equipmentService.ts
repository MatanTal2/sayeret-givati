/**
 * Equipment Service - Firestore CRUD Operations
 * Handles both equipments (types) and equipment (individual items) collections
 * Following established patterns from userService.ts
 */

import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';

import { 
  EquipmentType, 
  Equipment, 
  EquipmentStatus,
  EquipmentAction,
  EquipmentHistoryEntry,
  ApprovalDetails
} from '@/types/equipment';
import { EquipmentTemplate } from '@/data/equipmentTemplates';

import { TEXT_CONSTANTS } from '@/constants/text';

// Collection names - following established patterns
const EQUIPMENTS_COLLECTION = 'equipments'; // Equipment types/templates
const EQUIPMENT_COLLECTION = 'equipment';   // Individual equipment items

/**
 * Service result interfaces
 */
export interface EquipmentServiceResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export interface EquipmentListResult {
  success: boolean;
  equipments: Equipment[];
  totalCount: number;
  hasMore: boolean;
  error?: string;
}

export interface EquipmentTypeListResult {
  success: boolean;
  equipmentTypes: EquipmentType[];
  totalCount: number;
  error?: string;
}

/**
 * Equipment Types Service (equipments collection)
 */
export class EquipmentTypesService {
  
  /**
   * Create a new equipment type
   */
  static async createEquipmentType(
    equipmentTypeData: Omit<EquipmentType, 'createdAt' | 'updatedAt'>
  ): Promise<EquipmentServiceResult> {
    try {
      const equipmentTypeDoc = doc(db, EQUIPMENTS_COLLECTION, equipmentTypeData.id);
      
      // Check if equipment type already exists
      const existingDoc = await getDoc(equipmentTypeDoc);
      if (existingDoc.exists()) {
        return {
          success: false,
          message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_TYPE_EXISTS || 'Equipment type already exists',
          error: 'EQUIPMENT_TYPE_EXISTS'
        };
      }

      const equipmentType: EquipmentType = {
        ...equipmentTypeData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(equipmentTypeDoc, equipmentType);

      return {
        success: true,
        message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_TYPE_CREATED || 'Equipment type created successfully',
        data: equipmentType
      };

    } catch (error) {
      console.error('Error creating equipment type:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR || 'Failed to create equipment type',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get equipment type by ID
   */
  static async getEquipmentType(typeId: string): Promise<EquipmentServiceResult> {
    try {
      const equipmentTypeDoc = doc(db, EQUIPMENTS_COLLECTION, typeId);
      const docSnapshot = await getDoc(equipmentTypeDoc);

      if (!docSnapshot.exists()) {
        return {
          success: false,
          message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_TYPE_NOT_FOUND || 'Equipment type not found',
          error: 'EQUIPMENT_TYPE_NOT_FOUND'
        };
      }

      return {
        success: true,
        message: 'Equipment type retrieved successfully',
        data: { id: docSnapshot.id, ...docSnapshot.data() } as EquipmentType
      };

    } catch (error) {
      console.error('Error getting equipment type:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.CONNECTION_ERROR || 'Failed to get equipment type',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all equipment types
   */
  static async getEquipmentTypes(
    { activeOnly = true, category = null }: { activeOnly?: boolean; category?: string | null } = {}
  ): Promise<EquipmentTypeListResult> {
    try {
      let q = query(collection(db, EQUIPMENTS_COLLECTION), orderBy('sortOrder'), orderBy('name'));
      
      // Filter by active status
      if (activeOnly) {
        q = query(q, where('isActive', '==', true));
      }
      
      // Filter by category
      if (category) {
        q = query(q, where('category', '==', category));
      }

      const querySnapshot = await getDocs(q);
      const equipmentTypes: EquipmentType[] = [];

      querySnapshot.forEach((doc) => {
        equipmentTypes.push({ id: doc.id, ...doc.data() } as EquipmentType);
      });

      return {
        success: true,
        equipmentTypes,
        totalCount: equipmentTypes.length
      };

    } catch (error) {
      console.error('Error getting equipment types:', error);
      return {
        success: false,
        equipmentTypes: [],
        totalCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update equipment type
   */
  static async updateEquipmentType(
    typeId: string, 
    updates: Partial<Omit<EquipmentType, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<EquipmentServiceResult> {
    try {
      const equipmentTypeDoc = doc(db, EQUIPMENTS_COLLECTION, typeId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(equipmentTypeDoc, updateData);

      return {
        success: true,
        message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_TYPE_UPDATED || 'Equipment type updated successfully'
      };

    } catch (error) {
      console.error('Error updating equipment type:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR || 'Failed to update equipment type',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Equipment Items Service (equipment collection)
 */
export class EquipmentItemsService {

  /**
   * Create a new equipment item
   */
  static async createEquipment(
    equipmentData: Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>,
    initialHolder: string,
    signedBy: string,
    notes?: string
  ): Promise<EquipmentServiceResult> {
    try {
      const equipmentDoc = doc(db, EQUIPMENT_COLLECTION, equipmentData.id);
      
      // Check if equipment already exists
      const existingDoc = await getDoc(equipmentDoc);
      if (existingDoc.exists()) {
        return {
          success: false,
          message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_EXISTS || 'Equipment with this serial number already exists',
          error: 'EQUIPMENT_EXISTS'
        };
      }

      const now = serverTimestamp() as Timestamp;
      
      // Create initial tracking history entry
      const initialHistoryEntry: EquipmentHistoryEntry = {
        holder: initialHolder,
        fromDate: now,
        action: EquipmentAction.INITIAL_SIGN_IN,
        updatedBy: signedBy,
        location: equipmentData.location,
        notes: notes || TEXT_CONSTANTS.FEATURES.EQUIPMENT.INITIAL_SIGN_IN || 'Initial sign-in',
        timestamp: now
      };

      const equipment: Equipment = {
        ...equipmentData,
        currentHolder: initialHolder,
        signedBy,
        trackingHistory: [initialHistoryEntry],
        createdAt: now,
        updatedAt: now
      };

      await setDoc(equipmentDoc, equipment);

      return {
        success: true,
        message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_CREATED || 'Equipment created successfully',
        data: equipment
      };

    } catch (error) {
      console.error('Error creating equipment:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR || 'Failed to create equipment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get equipment by ID
   */
  static async getEquipment(equipmentId: string): Promise<EquipmentServiceResult> {
    try {
      const equipmentDoc = doc(db, EQUIPMENT_COLLECTION, equipmentId);
      const docSnapshot = await getDoc(equipmentDoc);

      if (!docSnapshot.exists()) {
        return {
          success: false,
          message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_NOT_FOUND || 'Equipment not found',
          error: 'EQUIPMENT_NOT_FOUND'
        };
      }

      return {
        success: true,
        message: 'Equipment retrieved successfully',
        data: { id: docSnapshot.id, ...docSnapshot.data() } as Equipment
      };

    } catch (error) {
      console.error('Error getting equipment:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.CONNECTION_ERROR || 'Failed to get equipment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get equipment list with filters
   */
  static async getEquipmentList(filters: {
    holder?: string;
    unit?: string;
    status?: EquipmentStatus[];
    category?: string;
    equipmentType?: string;
    limitCount?: number;
  } = {}): Promise<EquipmentListResult> {
    try {
      let q = query(collection(db, EQUIPMENT_COLLECTION), orderBy('updatedAt', 'desc'));
      
      // Apply filters
      if (filters.holder) {
        q = query(q, where('currentHolder', '==', filters.holder));
      }
      
      if (filters.unit) {
        q = query(q, where('assignedUnit', '==', filters.unit));
      }
      
      if (filters.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status));
      }
      
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      
      if (filters.equipmentType) {
        q = query(q, where('equipmentType', '==', filters.equipmentType));
      }
      
      if (filters.limitCount) {
        q = query(q, limit(filters.limitCount));
      }

      const querySnapshot = await getDocs(q);
      const equipments: Equipment[] = [];

      querySnapshot.forEach((doc) => {
        equipments.push({ id: doc.id, ...doc.data() } as Equipment);
      });

      return {
        success: true,
        equipments,
        totalCount: equipments.length,
        hasMore: filters.limitCount ? equipments.length === filters.limitCount : false
      };

    } catch (error) {
      console.error('Error getting equipment list:', error);
      return {
        success: false,
        equipments: [],
        totalCount: 0,
        hasMore: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update equipment (status, condition, etc.)
   */
  static async updateEquipment(
    equipmentId: string,
    updates: Partial<Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'trackingHistory'>>,
    updatedBy: string,
    action: EquipmentAction,
    notes?: string
  ): Promise<EquipmentServiceResult> {
    try {
      const equipmentDoc = doc(db, EQUIPMENT_COLLECTION, equipmentId);
      const currentDoc = await getDoc(equipmentDoc);
      
      if (!currentDoc.exists()) {
        return {
          success: false,
          message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_NOT_FOUND || 'Equipment not found',
          error: 'EQUIPMENT_NOT_FOUND'
        };
      }

      const currentEquipment = currentDoc.data() as Equipment;
      const now = serverTimestamp() as Timestamp;

      // Create new tracking history entry
      const historyEntry: EquipmentHistoryEntry = {
        holder: currentEquipment.currentHolder,
        fromDate: now,
        action,
        updatedBy,
        location: updates.location || currentEquipment.location,
        notes: notes || `${action} update`,
        timestamp: now
      };

      const updateData = {
        ...updates,
        trackingHistory: [...currentEquipment.trackingHistory, historyEntry],
        updatedAt: now
      };

      await updateDoc(equipmentDoc, updateData);

      return {
        success: true,
        message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_UPDATED || 'Equipment updated successfully'
      };

    } catch (error) {
      console.error('Error updating equipment:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR || 'Failed to update equipment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Transfer equipment to new holder
   */
  static async transferEquipment(
    equipmentId: string,
    newHolder: string,
    updatedBy: string,
    approvalDetails: ApprovalDetails,
    newUnit?: string,
    newLocation?: string,
    notes?: string
  ): Promise<EquipmentServiceResult> {
    try {
      const equipmentDoc = doc(db, EQUIPMENT_COLLECTION, equipmentId);
      const currentDoc = await getDoc(equipmentDoc);
      
      if (!currentDoc.exists()) {
        return {
          success: false,
          message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_NOT_FOUND || 'Equipment not found',
          error: 'EQUIPMENT_NOT_FOUND'
        };
      }

      const currentEquipment = currentDoc.data() as Equipment;
      const now = serverTimestamp() as Timestamp;

      // Close previous history entry
      const updatedHistory = [...currentEquipment.trackingHistory];
      const lastEntry = updatedHistory[updatedHistory.length - 1];
      if (lastEntry && !lastEntry.toDate) {
        lastEntry.toDate = now;
      }

      // Create new tracking history entry
      const transferEntry: EquipmentHistoryEntry = {
        holder: newHolder,
        fromDate: now,
        action: approvalDetails.emergencyOverride ? EquipmentAction.EMERGENCY_TRANSFER : EquipmentAction.TRANSFER,
        updatedBy,
        location: newLocation || currentEquipment.location,
        notes: notes || TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_TRANSFERRED || 'Equipment transferred',
        approval: approvalDetails,
        timestamp: now
      };

      updatedHistory.push(transferEntry);

      const updateData = {
        currentHolder: newHolder,
        assignedUnit: newUnit || currentEquipment.assignedUnit,
        location: newLocation || currentEquipment.location,
        trackingHistory: updatedHistory,
        updatedAt: now
      };

      await updateDoc(equipmentDoc, updateData);

      return {
        success: true,
        message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRANSFER_SUCCESS || 'Equipment transferred successfully'
      };

    } catch (error) {
      console.error('Error transferring equipment:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR || 'Failed to transfer equipment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Combined Equipment Service
 * Provides unified access to both equipment types and items
 */
export class EquipmentService {
  static Types = EquipmentTypesService;
  static Items = EquipmentItemsService;

  /**
   * Initialize equipment types from templates
   * Used for seeding the database with predefined equipment types
   */
  static async seedEquipmentTypes(templates: EquipmentTemplate[]): Promise<EquipmentServiceResult> {
    try {
      const batch = writeBatch(db);
      let addedCount = 0;

      for (const template of templates) {
        const equipmentTypeDoc = doc(db, EQUIPMENTS_COLLECTION, template.id);
        
        // Check if already exists
        const existingDoc = await getDoc(equipmentTypeDoc);
        if (!existingDoc.exists()) {
          const equipmentType: EquipmentType = {
            ...template,
            // Add missing required fields with defaults
            requiresApproval: template.requiresApproval ?? true,
            isActive: true,
            sortOrder: addedCount,
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp
          };
          
          batch.set(equipmentTypeDoc, equipmentType);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        await batch.commit();
      }

      return {
        success: true,
        message: `${addedCount} equipment types added successfully`,
        data: { addedCount }
      };

    } catch (error) {
      console.error('Error seeding equipment types:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR || 'Failed to seed equipment types',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default EquipmentService;


