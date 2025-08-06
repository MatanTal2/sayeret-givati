/**
 * Equipment Service for managing equipment collection
 * Manages Firestore operations for equipment items based on itemTypes templates
 */

import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ADMIN_CONFIG } from '@/constants/admin';
import { Equipment } from '@/types/equipment';
import { ItemTypesService } from '@/lib/itemTypesService';

export interface EquipmentOperationResult {
  success: boolean;
  message: string;
  equipmentId?: string;
  error?: string;
}

export interface BulkEquipmentResult {
  successful: { equipment: Equipment; id: string }[];
  failed: { equipment: Equipment; error: string }[];
}

export interface CreateEquipmentData {
  id: string;
  itemTypeId: string;
  assignedUserId: string;
  assignedUserName?: string;
  equipmentDepot?: string; // Optional override from template
  status?: string; // Optional override from template
  imageUrl?: string;
}

/**
 * Sample equipment data based on itemTypes templates
 */
export const SAMPLE_EQUIPMENT_DATA: CreateEquipmentData[] = [
  {
    id: "EQ-RADIO-001",
    itemTypeId: "TEMPLATE_RADIO_PRC-152",
    assignedUserId: "user-001",
    assignedUserName: "דני כהן",
    status: "active",
    imageUrl: "https://storage.googleapis.com/sayeret-givati/equipment/radio-prc152-001.jpg"
  },
  {
    id: "EQ-RADIO-002", 
    itemTypeId: "TEMPLATE_RADIO_PRC-152",
    assignedUserId: "user-002",
    assignedUserName: "יוסי לוי",
    status: "active",
    imageUrl: "https://storage.googleapis.com/sayeret-givati/equipment/radio-prc152-002.jpg"
  },
  {
    id: "EQ-OPTICS-001",
    itemTypeId: "TEMPLATE_OPTICS_ACOG",
    assignedUserId: "user-003",
    assignedUserName: "מיכאל אברהם",
    status: "active",
    imageUrl: "https://storage.googleapis.com/sayeret-givati/equipment/acog-001.jpg"
  },
  {
    id: "EQ-OPTICS-002",
    itemTypeId: "TEMPLATE_OPTICS_ACOG", 
    assignedUserId: "user-004",
    assignedUserName: "עמית שמשון",
    status: "active",
    imageUrl: "https://storage.googleapis.com/sayeret-givati/equipment/acog-002.jpg"
  },
  {
    id: "EQ-ROPE-001",
    itemTypeId: "TEMPLATE_EXTRACTION_ROPE_30M",
    assignedUserId: "team-alpha",
    assignedUserName: "כיתה אלפא",
    status: "active",
    imageUrl: "https://storage.googleapis.com/sayeret-givati/equipment/rope-30m-001.jpg"
  },
  {
    id: "EQ-ROPE-002",
    itemTypeId: "TEMPLATE_EXTRACTION_ROPE_30M",
    assignedUserId: "team-bravo", 
    assignedUserName: "כיתה בראבו",
    equipmentDepot: "Advanced Gear Depot", // Override from template
    status: "maintenance",
    imageUrl: "https://storage.googleapis.com/sayeret-givati/equipment/rope-30m-002.jpg"
  }
];

export class EquipmentService {
  /**
   * Create a new equipment item based on an itemType template
   */
  static async createEquipment(equipmentData: CreateEquipmentData): Promise<EquipmentOperationResult> {
    try {
      // Validate required fields
      if (!equipmentData.id || !equipmentData.itemTypeId || !equipmentData.assignedUserId) {
        return {
          success: false,
          message: 'Missing required fields: id, itemTypeId, or assignedUserId',
          error: 'VALIDATION_ERROR'
        };
      }

      // Get the itemType template
      const itemTypes = await ItemTypesService.getAllItemTypes();
      const itemType = itemTypes.find(type => type.id === equipmentData.itemTypeId);
      
      if (!itemType) {
        return {
          success: false,
          message: `ItemType template not found: ${equipmentData.itemTypeId}`,
          error: 'ITEM_TYPE_NOT_FOUND'
        };
      }

      // Create equipment document using template data
      const equipment: Equipment = {
        id: equipmentData.id,
        itemTypeId: equipmentData.itemTypeId,
        category: itemType.category,
        model: itemType.model,
        manufacturer: itemType.manufacturer,
        assignmentType: itemType.assignmentType,
        equipmentDepot: equipmentData.equipmentDepot || itemType.defaultDepot,
        assignedUserId: equipmentData.assignedUserId,
        assignedUserName: equipmentData.assignedUserName,
        status: equipmentData.status || itemType.defaultStatus,
        registeredAt: new Date().toISOString(),
        imageUrl: equipmentData.imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to Firestore
      const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_EQUIPMENT_COLLECTION, equipmentData.id);
      await setDoc(docRef, {
        ...equipment,
        registeredAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Successfully created equipment: ${itemType.manufacturer} ${itemType.model} (${equipmentData.id})`);
      return {
        success: true,
        message: `Successfully created equipment: ${itemType.manufacturer} ${itemType.model}`,
        equipmentId: equipmentData.id
      };

    } catch (error) {
      console.error('❌ Error creating equipment:', error);
      return {
        success: false,
        message: 'Failed to create equipment. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Seed the equipment collection with sample data
   */
  static async seedEquipment(equipmentList: CreateEquipmentData[] = SAMPLE_EQUIPMENT_DATA): Promise<BulkEquipmentResult> {
    const successful: { equipment: Equipment; id: string }[] = [];
    const failed: { equipment: Equipment; error: string }[] = [];

    try {
      // Check if collection already has data
      const existingEquipment = await this.getAllEquipment();
      if (existingEquipment.length > 0) {
        console.log('⚠️ Equipment collection already has data. Skipping seed operation.');
        return {
          successful: existingEquipment.map(item => ({ equipment: item, id: item.id })),
          failed: []
        };
      }

      // Get all itemTypes for template lookup
      const itemTypes = await ItemTypesService.getAllItemTypes();
      const itemTypeMap = new Map(itemTypes.map(type => [type.id, type]));

      // Create batch for efficient operations
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();

      for (const equipmentData of equipmentList) {
        try {
          // Validate data
          if (!equipmentData.id || !equipmentData.itemTypeId || !equipmentData.assignedUserId) {
            const tempEquipment = { id: equipmentData.id } as Equipment;
            failed.push({
              equipment: tempEquipment,
              error: 'Missing required fields: id, itemTypeId, or assignedUserId'
            });
            continue;
          }

          // Get template
          const itemType = itemTypeMap.get(equipmentData.itemTypeId);
          if (!itemType) {
            const tempEquipment = { id: equipmentData.id } as Equipment;
            failed.push({
              equipment: tempEquipment,
              error: `ItemType template not found: ${equipmentData.itemTypeId}`
            });
            continue;
          }

          // Create equipment document
          const equipment: Equipment = {
            id: equipmentData.id,
            itemTypeId: equipmentData.itemTypeId,
            category: itemType.category,
            model: itemType.model,
            manufacturer: itemType.manufacturer,
            assignmentType: itemType.assignmentType,
            equipmentDepot: equipmentData.equipmentDepot || itemType.defaultDepot,
            assignedUserId: equipmentData.assignedUserId,
            assignedUserName: equipmentData.assignedUserName,
            status: equipmentData.status || itemType.defaultStatus,
            registeredAt: new Date().toISOString(),
            imageUrl: equipmentData.imageUrl
          };

          const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_EQUIPMENT_COLLECTION, equipmentData.id);
          batch.set(docRef, {
            ...equipment,
            registeredAt: timestamp,
            createdAt: timestamp,
            updatedAt: timestamp
          });

          successful.push({ equipment, id: equipmentData.id });

        } catch (error) {
          const tempEquipment = { id: equipmentData.id } as Equipment;
          failed.push({
            equipment: tempEquipment,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Commit the batch
      if (successful.length > 0) {
        await batch.commit();
        console.log(`✅ Successfully seeded ${successful.length} equipment items to Firestore`);
      }

      console.log(`🎯 Equipment seeding completed: ${successful.length} successful, ${failed.length} failed`);
      return { successful, failed };

    } catch (error) {
      console.error('❌ Error seeding equipment:', error);
      
      // Mark all as failed if batch operation fails
      const allFailed = equipmentList.map(equipmentData => ({
        equipment: { id: equipmentData.id } as Equipment,
        error: error instanceof Error ? error.message : 'Batch operation failed'
      }));

      return { successful: [], failed: allFailed };
    }
  }

  /**
   * Get all equipment items
   */
  static async getAllEquipment(): Promise<Equipment[]> {
    try {
      const equipmentCollection = collection(db, ADMIN_CONFIG.FIRESTORE_EQUIPMENT_COLLECTION);
      const snapshot = await getDocs(equipmentCollection);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Equipment[];

    } catch (error) {
      console.error('❌ Error fetching equipment:', error);
      return [];
    }
  }

  /**
   * Get equipment by assigned user ID
   */
  static async getEquipmentByUserId(userId: string): Promise<Equipment[]> {
    try {
      const equipmentCollection = collection(db, ADMIN_CONFIG.FIRESTORE_EQUIPMENT_COLLECTION);
      const q = query(equipmentCollection, where('assignedUserId', '==', userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Equipment[];

    } catch (error) {
      console.error('❌ Error fetching equipment by user ID:', error);
      return [];
    }
  }

  /**
   * Get equipment by category
   */
  static async getEquipmentByCategory(category: string): Promise<Equipment[]> {
    try {
      const equipmentCollection = collection(db, ADMIN_CONFIG.FIRESTORE_EQUIPMENT_COLLECTION);
      const q = query(equipmentCollection, where('category', '==', category));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Equipment[];

    } catch (error) {
      console.error('❌ Error fetching equipment by category:', error);
      return [];
    }
  }

  /**
   * Get equipment by assignment type
   */
  static async getEquipmentByAssignmentType(assignmentType: 'team' | 'personal'): Promise<Equipment[]> {
    try {
      const equipmentCollection = collection(db, ADMIN_CONFIG.FIRESTORE_EQUIPMENT_COLLECTION);
      const q = query(equipmentCollection, where('assignmentType', '==', assignmentType));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Equipment[];

    } catch (error) {
      console.error('❌ Error fetching equipment by assignment type:', error);
      return [];
    }
  }

  /**
   * Check if the equipment collection is empty
   */
  static async isCollectionEmpty(): Promise<boolean> {
    try {
      const equipment = await this.getAllEquipment();
      return equipment.length === 0;
    } catch (error) {
      console.error('❌ Error checking collection status:', error);
      return true; // Assume empty on error
    }
  }

  /**
   * Update equipment status
   */
  static async updateEquipmentStatus(equipmentId: string, status: string): Promise<EquipmentOperationResult> {
    try {
      const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_EQUIPMENT_COLLECTION, equipmentId);
      await setDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return {
        success: true,
        message: `Equipment status updated to: ${status}`,
        equipmentId
      };

    } catch (error) {
      console.error('❌ Error updating equipment status:', error);
      return {
        success: false,
        message: 'Failed to update equipment status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Transfer equipment to a new user
   */
  static async transferEquipment(
    equipmentId: string, 
    newUserId: string, 
    newUserName?: string
  ): Promise<EquipmentOperationResult> {
    try {
      const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_EQUIPMENT_COLLECTION, equipmentId);
      await setDoc(docRef, {
        assignedUserId: newUserId,
        assignedUserName: newUserName,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return {
        success: true,
        message: `Equipment transferred to: ${newUserName || newUserId}`,
        equipmentId
      };

    } catch (error) {
      console.error('❌ Error transferring equipment:', error);
      return {
        success: false,
        message: 'Failed to transfer equipment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}