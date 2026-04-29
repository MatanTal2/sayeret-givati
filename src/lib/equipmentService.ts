/**
 * Equipment Service - Firestore CRUD Operations
 * Handles both equipments (types) and equipment (individual items) collections
 * Following established patterns from userService.ts
 */

import { db, auth } from '@/lib/firebase';
import { apiFetch } from '@/lib/apiFetch';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

import {
  EquipmentType,
  Equipment,
  EquipmentStatus,
  EquipmentAction,
  EquipmentHistoryEntry,
  ApprovalDetails,
  TemplateStatus,
} from '@/types/equipment';
import { EquipmentTemplate } from '@/data/equipmentTemplates';
import { 
  addTrackingHistoryEntry, 
  createEquipmentCreatedEntry 
} from './equipmentHistoryService';
import { ActionLogHelpers } from './actionsLogService';

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
  /**
   * Create a new equipment type.
   * Delegates to server API route (firebase-admin) for the write.
   */
  static async createEquipmentType(
    equipmentTypeData: Omit<EquipmentType, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<EquipmentServiceResult> {
    try {
      const response = await apiFetch('/api/equipment-templates', {
        method: 'POST',
        body: JSON.stringify(equipmentTypeData),
      });
      const result = await response.json();

      if (!result.success) {
        return { success: false, message: result.error || 'Failed to create equipment type', error: result.error };
      }

      return {
        success: true,
        message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_TYPE_CREATED || 'Equipment type created successfully',
        data: { ...equipmentTypeData, id: result.id } as EquipmentType
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
  /**
   * Update equipment type.
   * Delegates to server API route (firebase-admin) for the write.
   */
  static async updateEquipmentType(
    typeId: string,
    updates: Partial<Omit<EquipmentType, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<EquipmentServiceResult> {
    try {
      const response = await apiFetch('/api/equipment-templates', {
        method: 'PUT',
        body: JSON.stringify({ id: typeId, ...updates }),
      });
      const result = await response.json();

      if (!result.success) {
        return { success: false, message: result.error || 'Failed to update equipment type', error: result.error };
      }

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

      // Create initial tracking history entry
      const initialHistoryEntry = createEquipmentCreatedEntry(
        initialHolderName,
        equipmentData.location,
        initialHolderId,
        notes || TEXT_CONSTANTS.FEATURES.EQUIPMENT.INITIAL_SIGN_IN || 'Initial sign-in'
      );

      const trackingHistory = addTrackingHistoryEntry([], initialHistoryEntry);

      const equipment: Equipment = {
        ...equipmentData,
        currentHolder: initialHolderName, // Display name for UI
        currentHolderId: initialHolderId, // UID for queries and permissions
        signedBy,
        trackingHistory,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      // Create equipment + action log via server API route (firebase-admin transaction)
      const createResponse = await apiFetch('/api/equipment', {
        method: 'POST',
        body: JSON.stringify({
          equipmentData,
          initialHolderName,
          initialHolderId,
          signedBy,
          trackingHistory,
          actionLog: ActionLogHelpers.equipmentCreated(
            equipmentData.id,
            equipmentData.id,
            equipmentData.productName,
            initialHolderId,
            initialHolderName
          ),
        }),
      });
      const createResult = await createResponse.json();
      if (!createResult.success) {
        return { success: false, message: createResult.error || 'Failed to create equipment', error: createResult.error };
      }

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
    notes?: string,
    requesterUserType?: string // Add user type for permission checking
  ): Promise<EquipmentServiceResult> {
    try {
      // Permission check: Only admin, system_manager, and manager can update equipment
      if (requesterUserType && !['admin', 'system_manager', 'manager'].includes(requesterUserType)) {
        return {
          success: false,
          message: 'אין לך הרשאה לעדכן ציוד. פעולה זו מוגבלת למנהלים בלבד.',
          error: 'INSUFFICIENT_PERMISSIONS'
        };
      }

      // Read current equipment to get tracking history (client SDK read)
      const equipmentDocRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
      const currentDoc = await getDoc(equipmentDocRef);

      if (!currentDoc.exists()) {
        return {
          success: false,
          message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_NOT_FOUND || 'Equipment not found',
          error: 'EQUIPMENT_NOT_FOUND'
        };
      }

      const currentEquipment = currentDoc.data() as Equipment;
      const now = Timestamp.fromDate(new Date());

      const historyEntry: EquipmentHistoryEntry = {
        action,
        holder: currentEquipment.currentHolder,
        location: updates.location || currentEquipment.location,
        notes: notes || `${action} update`,
        timestamp: now,
        updatedBy
      };

      // Update via server API route (firebase-admin)
      const updateResponse = await apiFetch('/api/equipment', {
        method: 'PUT',
        body: JSON.stringify({
          equipmentId,
          updates,
          historyEntry,
          currentTrackingHistory: currentEquipment.trackingHistory,
        }),
      });
      const updateResult = await updateResponse.json();
      if (!updateResult.success) {
        return { success: false, message: updateResult.error || 'Failed to update equipment', error: updateResult.error };
      }

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
   * Create N equipment items in a single atomic batch.
   * Each item must have a unique id (S/N) and its own photoUrl.
   */
  static async createEquipmentBatch(
    items: Array<Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>>,
    initialHolderName: string,
    initialHolderId: string,
    signedBy: string,
    signedById: string,
    notes?: string
  ): Promise<EquipmentServiceResult> {
    try {
      if (items.length === 0) {
        return { success: false, message: 'At least one item is required', error: 'EMPTY_BATCH' };
      }

      const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const initialNote = notes || TEXT_CONSTANTS.FEATURES.EQUIPMENT.INITIAL_SIGN_IN || 'Initial sign-in';

      const payloadItems = items.map((equipmentData) => {
        const historyEntry = createEquipmentCreatedEntry(
          initialHolderName,
          equipmentData.location,
          initialHolderId,
          initialNote
        );
        const trackingHistory = addTrackingHistoryEntry([], historyEntry);
        return {
          equipmentData,
          trackingHistory,
          actionLog: ActionLogHelpers.equipmentCreated(
            equipmentData.id,
            equipmentData.id,
            equipmentData.productName,
            initialHolderId,
            initialHolderName
          ),
        };
      });

      const response = await apiFetch('/api/equipment/batch', {
        method: 'POST',
        body: JSON.stringify({
          items: payloadItems,
          batchId,
          initialHolderName,
          initialHolderId,
          signedBy,
          signedById,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        return { success: false, message: result.error || 'Failed to create batch', error: result.error };
      }
      return {
        success: true,
        message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_CREATED || 'Equipment batch created',
        data: { batchId: result.batchId, ids: result.ids },
      };
    } catch (error) {
      console.error('Error creating equipment batch:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR || 'Failed to create equipment batch',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Submit a report on an equipment item.
   * Pass photoUrl=null only when the actor is privileged (enforced server-side
   * via equipmentPolicy.canReportWithoutPhoto).
   */
  static async reportEquipment(
    equipmentId: string,
    photoUrl: string | null,
    actorName: string,
    note?: string
  ): Promise<EquipmentServiceResult> {
    try {
      const response = await apiFetch('/api/equipment/report', {
        method: 'POST',
        body: JSON.stringify({
          equipmentId,
          photoUrl,
          actorName,
          ...(note ? { note } : {}),
        }),
      });
      const result = await response.json();
      if (!result.success) {
        return { success: false, message: result.error || 'Failed to submit report', error: result.error };
      }
      return { success: true, message: 'Report submitted' };
    } catch (error) {
      console.error('Error submitting report:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR || 'Failed to submit report',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retire an equipment item (signer-only).
   * Returns { kind: 'retired' } when signer == holder, or
   * { kind: 'request_created', requestId } when a holder-approval step is needed.
   */
  static async retireEquipment(
    equipmentId: string,
    actorName: string,
    reason: string
  ): Promise<EquipmentServiceResult> {
    try {
      const response = await apiFetch('/api/equipment/retire', {
        method: 'POST',
        body: JSON.stringify({ equipmentId, actorName, reason }),
      });
      const result = await response.json();
      if (!result.success) {
        return { success: false, message: result.error || 'Failed to retire equipment', error: result.error };
      }
      return { success: true, message: 'Retire action recorded', data: result.outcome };
    } catch (error) {
      console.error('Error retiring equipment:', error);
      return {
        success: false,
        message: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR || 'Failed to retire equipment',
        error: error instanceof Error ? error.message : 'Unknown error',
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
    notes?: string,
    requesterUserType?: string // Add user type for permission checking
  ): Promise<EquipmentServiceResult> {
    try {
      // Permission check: Only admin, system_manager, and manager can transfer equipment
      if (requesterUserType && !['admin', 'system_manager', 'manager'].includes(requesterUserType)) {
        return {
          success: false,
          message: 'אין לך הרשאה להעביר ציוד. פעולה זו מוגבלת למנהלים בלבד.',
          error: 'INSUFFICIENT_PERMISSIONS'
        };
      }

      // Read current equipment (client SDK read)
      const equipmentDocRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
      const currentDoc = await getDoc(equipmentDocRef);

      if (!currentDoc.exists()) {
        return {
          success: false,
          message: TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_NOT_FOUND || 'Equipment not found',
          error: 'EQUIPMENT_NOT_FOUND'
        };
      }

      const currentEquipment = currentDoc.data() as Equipment;
      const now = Timestamp.fromDate(new Date());

      const transferEntry: EquipmentHistoryEntry = {
        action: approvalDetails.emergencyOverride ? 'emergency_transfer' : 'transfer_completed',
        holder: newHolder,
        location: newLocation || currentEquipment.location,
        notes: notes || TEXT_CONSTANTS.FEATURES.EQUIPMENT.EQUIPMENT_TRANSFERRED || 'Equipment transferred',
        timestamp: now,
        updatedBy
      };

      // Transfer via server API route (firebase-admin)
      const transferResponse = await apiFetch('/api/equipment/transfer', {
        method: 'POST',
        body: JSON.stringify({
          equipmentId,
          newHolder,
          newHolderId,
          newLocation,
          transferEntry,
          currentTrackingHistory: currentEquipment.trackingHistory,
          currentLocation: currentEquipment.location,
        }),
      });
      const transferResult = await transferResponse.json();
      if (!transferResult.success) {
        return { success: false, message: transferResult.error || 'Failed to transfer equipment', error: transferResult.error };
      }

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
            requiresSerialNumber: true,
            isActive: true,
            templateCreatorId: 'system', // System-created templates
            status: TemplateStatus.CANONICAL,
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


