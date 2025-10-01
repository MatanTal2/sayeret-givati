/**
 * Equipment Service - Firestore CRUD Operations
 * Handles both equipments (types) and equipment (individual items) collections
 * Following established patterns from userService.ts
 */

import { db, auth } from '@/lib/firebase';
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
const EQUIPMENT_TEMPLATES_COLLECTION = 'equipmentTemplates'; // Equipment types/templates
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
    equipmentTypeData: Omit<EquipmentType, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<EquipmentServiceResult> {
    try {
      // Use auto-generated document ID
      const equipmentTypeDoc = doc(collection(db, EQUIPMENT_TEMPLATES_COLLECTION));
      
      // Build equipment type object, removing undefined fields to prevent Firestore errors
      const equipmentType: EquipmentType = {
        ...equipmentTypeData,
        id: equipmentTypeDoc.id, // Use the auto-generated ID
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      // Build data object for Firestore, excluding undefined optional fields
      const dataToSave: Record<string, unknown> = {
        id: equipmentType.id,
        name: equipmentType.name,
        category: equipmentType.category,
        subcategory: equipmentType.subcategory,
        requiresDailyStatusCheck: equipmentType.requiresDailyStatusCheck,
        isActive: equipmentType.isActive,
        templateCreatorId: equipmentType.templateCreatorId,
        createdAt: equipmentType.createdAt,
        updatedAt: equipmentType.updatedAt
      };

      // Add optional fields only if they are defined
      if (equipmentType.description !== undefined) {
        dataToSave.description = equipmentType.description;
      }
      if (equipmentType.notes !== undefined) {
        dataToSave.notes = equipmentType.notes;
      }

      await setDoc(equipmentTypeDoc, dataToSave);

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
      const equipmentTypeDoc = doc(db, EQUIPMENT_TEMPLATES_COLLECTION, typeId);
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
   * Get all equipment templates from Firestore
   */
  static async getTemplates(): Promise<EquipmentServiceResult> {
    try {
      console.log('🔍 Fetching templates from Firestore');
      
      const querySnapshot = await getDocs(collection(db, EQUIPMENT_TEMPLATES_COLLECTION));
      const templates: EquipmentType[] = [];

      querySnapshot.forEach((doc) => {
        templates.push({ id: doc.id, ...doc.data() } as EquipmentType);
      });

      console.log(`✅ Fetched ${templates.length} templates from Firestore`);
      
      return {
        success: true,
        message: `Successfully fetched ${templates.length} templates`,
        data: templates
      };

    } catch (error) {
      console.error('❌ Error fetching templates from Firestore:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.CONNECTION_ERROR || 'Failed to fetch templates',
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
      console.log('🔍 DEBUG: Starting getEquipmentTypes');
      console.log('🔍 DEBUG: Auth state in getEquipmentTypes:', auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email
      } : 'No user authenticated');
      
      let q = query(collection(db, EQUIPMENT_TEMPLATES_COLLECTION), orderBy('sortOrder'), orderBy('name'));
      
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
      const equipmentTypeDoc = doc(db, EQUIPMENT_TEMPLATES_COLLECTION, typeId);
      
      // Build update object, excluding undefined values
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp()
      };

      // Add only defined fields from updates
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.requiresDailyStatusCheck !== undefined) updateData.requiresDailyStatusCheck = updates.requiresDailyStatusCheck;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if (updates.templateCreatorId !== undefined) updateData.templateCreatorId = updates.templateCreatorId;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateDoc(equipmentTypeDoc, updateData as any);

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
    initialHolderName: string,
    initialHolderId: string,
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

      const now = Timestamp.fromDate(new Date());
      
      // Create initial tracking history entry
      const initialHistoryEntry: EquipmentHistoryEntry = {
        holder: initialHolderId, // Store UID for queries
        holderName: initialHolderName, // Cache display name for UI performance
        fromDate: now,
        action: EquipmentAction.INITIAL_SIGN_IN,
        updatedBy: initialHolderId,
        updatedByName: initialHolderName,
        location: equipmentData.location,
        notes: notes || TEXT_CONSTANTS.FEATURES.EQUIPMENT.INITIAL_SIGN_IN || 'Initial sign-in',
        timestamp: now
      };

      const equipment: Equipment = {
        ...equipmentData,
        currentHolder: initialHolderName, // Display name for UI
        currentHolderId: initialHolderId, // UID for queries and permissions
        signedBy,
        trackingHistory: [initialHistoryEntry],
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
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
    holder?: string; // Display name search
    holderId?: string; // User UID for exact queries
    unit?: string;
    status?: EquipmentStatus[];
    category?: string;
    equipmentType?: string;
    limitCount?: number;
  } = {}): Promise<EquipmentListResult> {
    try {
      let q = query(collection(db, EQUIPMENT_COLLECTION), orderBy('updatedAt', 'desc'));
      
      // Apply filters
      // Prefer holderId for exact queries, fallback to holder for display name search
      if (filters.holderId) {
        q = query(q, where('currentHolderId', '==', filters.holderId));
      } else if (filters.holder) {
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
    updatedByName: string,
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
      const now = Timestamp.fromDate(new Date());

      // Create new tracking history entry
      const historyEntry: EquipmentHistoryEntry = {
        holder: currentEquipment.currentHolderId, // Use UID for consistency
        holderName: currentEquipment.currentHolder, // Cache display name for UI performance
        fromDate: now,
        action,
        updatedBy,
        updatedByName,
        location: updates.location || currentEquipment.location,
        notes: notes || `${action} update`,
        timestamp: now
      };

      const updateData = {
        ...updates,
        trackingHistory: [...currentEquipment.trackingHistory, historyEntry],
        updatedAt: serverTimestamp() as Timestamp
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
    newHolderId: string,
    updatedBy: string,
    updatedByName: string,
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
      const now = Timestamp.fromDate(new Date());

      // Close previous history entry
      const updatedHistory = [...currentEquipment.trackingHistory];
      const lastEntry = updatedHistory[updatedHistory.length - 1];
      if (lastEntry && !lastEntry.toDate) {
        lastEntry.toDate = now;
      }

      // Create new tracking history entry
      const transferEntry: EquipmentHistoryEntry = {
        holder: newHolderId, // Store UID for queries
        holderName: newHolder, // Cache display name for UI performance
        fromDate: now,
        action: approvalDetails.emergencyOverride ? EquipmentAction.EMERGENCY_TRANSFER : EquipmentAction.TRANSFER,
        updatedBy,
        updatedByName,
        location: newLocation || currentEquipment.location,
        notes: notes || TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_TRANSFERRED || 'Equipment transferred',
        approval: approvalDetails,
        timestamp: now
      };

      updatedHistory.push(transferEntry);

      const updateData = {
        currentHolder: newHolder, // Display name for UI
        currentHolderId: newHolderId, // UID for queries and permissions
        assignedUnit: newUnit || currentEquipment.assignedUnit,
        location: newLocation || currentEquipment.location,
        trackingHistory: updatedHistory,
        updatedAt: serverTimestamp() as Timestamp
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
  static async seedEquipmentTypes(templates: EquipmentTemplate[], allowDuplicateHandling: boolean = false): Promise<EquipmentServiceResult> {
    try {
      console.log('🔍 DEBUG: Starting seedEquipmentTypes');
      console.log('🔍 DEBUG: Current user auth state:', auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified
      } : 'No user authenticated');
      
      // Check if user document exists in users collection (required by isAuthorizedUser function)
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          console.log('🔍 DEBUG: User document exists:', userDoc.exists());
          if (userDoc.exists()) {
            console.log('🔍 DEBUG: User document data:', userDoc.data());
          }
        } catch (userCheckError) {
          console.log('🔍 DEBUG: Error checking user document:', userCheckError);
        }
      }
      
      const batch = writeBatch(db);
      let addedCount = 0;
      const processedTemplates: EquipmentTemplate[] = [];

      for (const template of templates) {
        let finalId = template.id;
        let equipmentTypeDoc = doc(db, EQUIPMENT_TEMPLATES_COLLECTION, finalId);
        
        // Check if already exists
        const existingDoc = await getDoc(equipmentTypeDoc);
        
        if (existingDoc.exists() && allowDuplicateHandling) {
          // For testing: generate unique ID by adding random number
          const randomSuffix = Math.floor(Math.random() * 10000);
          finalId = `${template.id}_${randomSuffix}`;
          equipmentTypeDoc = doc(db, EQUIPMENT_TEMPLATES_COLLECTION, finalId);
          console.log(`ID conflict detected for ${template.id}, using unique ID: ${finalId}`);
        }
        
        if (!existingDoc.exists() || allowDuplicateHandling) {
          const equipmentType: EquipmentType = {
            id: finalId, // Use the potentially modified ID
            name: template.name,
            category: template.category,
            subcategory: template.subcategory || '',
            description: template.description,
            notes: 'commonNotes' in template ? (template as { commonNotes?: string }).commonNotes : undefined,
            requiresDailyStatusCheck: template.requiresDailyStatusCheck || false,
            isActive: true,
            templateCreatorId: 'system', // System-created templates
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp
          };
          
          batch.set(equipmentTypeDoc, equipmentType);
          processedTemplates.push({ ...template, id: finalId });
          addedCount++;
        } else {
          console.log(`Skipping existing equipment type: ${template.id}`);
        }
      }

      if (addedCount > 0) {
        await batch.commit();
        console.log(`Successfully added ${addedCount} equipment types`);
      } else {
        console.log('No new equipment types to add');
      }

      return {
        success: true,
        message: `${addedCount} equipment types added successfully`,
        data: { addedCount, processedTemplates }
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


