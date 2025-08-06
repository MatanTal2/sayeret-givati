/**
 * Item Types Service for managing equipment type templates
 * Manages Firestore operations for the itemTypes collection
 */

import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ADMIN_CONFIG } from '@/constants/admin';
import { ItemType } from '@/types/equipment';

export interface ItemTypeOperationResult {
  success: boolean;
  message: string;
  itemTypeId?: string;
  error?: string;
}

export interface BulkItemTypeResult {
  successful: { itemType: ItemType; id: string }[];
  failed: { itemType: ItemType; error: string }[];
}

/**
 * Mock data for standard army equipment item types
 */
export const MOCK_ITEM_TYPES: ItemType[] = [
  {
    id: "TEMPLATE_RADIO_PRC-152",
    category: "radio",
    model: "PRC-152",
    manufacturer: "Harris",
    assignmentType: "team",
    defaultDepot: "Radio Depot",
    defaultImageUrl: "",
    defaultStatus: "work"
  },
  {
    id: "TEMPLATE_OPTICS_ACOG",
    category: "optics",
    model: "ACOG 4x32",
    manufacturer: "Trijicon",
    assignmentType: "personal",
    defaultDepot: "Optics Depot",
    defaultImageUrl: "",
    defaultStatus: "work"
  },
  {
    id: "TEMPLATE_EXTRACTION_ROPE_30M",
    category: "extraction_gear",
    model: "Rescue Rope 30m",
    manufacturer: "Petzl",
    assignmentType: "team",
    defaultDepot: "Gear Depot",
    defaultImageUrl: "",
    defaultStatus: "work"
  }
];

export class ItemTypesService {
  /**
   * Seed the itemTypes collection with mock data
   * Uses Firebase batched writes for performance
   */
  static async seedItemTypes(itemTypes: ItemType[] = MOCK_ITEM_TYPES): Promise<BulkItemTypeResult> {
    const successful: { itemType: ItemType; id: string }[] = [];
    const failed: { itemType: ItemType; error: string }[] = [];

    try {
      // Check if collection already has data
      const existingDocs = await this.getAllItemTypes();
      if (existingDocs.length > 0) {
        console.log('⚠️ ItemTypes collection already has data. Skipping seed operation.');
        return {
          successful: existingDocs.map(item => ({ itemType: item, id: item.id })),
          failed: []
        };
      }

      // Create batch for efficient Firestore operations
      const batch = writeBatch(db);
      const BATCH_SIZE = 100; // Firestore limit is 500, use smaller batch for safety

      // Process items in batches
      for (let i = 0; i < itemTypes.length; i += BATCH_SIZE) {
        const batchItems = itemTypes.slice(i, i + BATCH_SIZE);

        for (const itemType of batchItems) {
          try {
            // Validate required fields
            if (!itemType.id || !itemType.category || !itemType.model) {
              failed.push({
                itemType,
                error: 'Missing required fields: id, category, or model'
              });
              continue;
            }

            // Create item type document with timestamps
            const itemTypeDoc = {
              ...itemType,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };

            const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_ITEM_TYPES_COLLECTION, itemType.id);
            batch.set(docRef, itemTypeDoc);

            successful.push({ itemType, id: itemType.id });
          } catch (error) {
            failed.push({
              itemType,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Commit the batch
        await batch.commit();
        console.log(`✅ Successfully seeded ${batchItems.length} item types to Firestore`);
      }

      console.log(`🎯 Seeding completed: ${successful.length} successful, ${failed.length} failed`);
      return { successful, failed };

    } catch (error) {
      console.error('❌ Error seeding item types:', error);
      
      // Mark all as failed if batch operation fails
      const allFailed = itemTypes.map(itemType => ({
        itemType,
        error: error instanceof Error ? error.message : 'Batch operation failed'
      }));

      return { successful: [], failed: allFailed };
    }
  }

  /**
   * Bulk add item types to the collection (allows adding to existing collection)
   * Similar to seedItemTypes but doesn't check if collection is empty
   */
  static async bulkAddItemTypes(itemTypes: ItemType[]): Promise<BulkItemTypeResult> {
    const successful: { itemType: ItemType; id: string }[] = [];
    const failed: { itemType: ItemType; error: string }[] = [];

    try {
      const BATCH_SIZE = 100; // Firestore limit is 500, use smaller batch for safety

      // Process items in batches
      for (let i = 0; i < itemTypes.length; i += BATCH_SIZE) {
        const batchItems = itemTypes.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db); // Create new batch for each iteration
        let batchCount = 0;

        for (const itemType of batchItems) {
          try {
            // Validate required fields
            if (!itemType.id || !itemType.category || !itemType.model) {
              failed.push({
                itemType,
                error: 'Missing required fields: id, category, or model'
              });
              continue;
            }

            // Create item type document with timestamps
            const itemTypeDoc = {
              ...itemType,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };

            const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_ITEM_TYPES_COLLECTION, itemType.id);
            batch.set(docRef, itemTypeDoc);
            batchCount++;

            successful.push({ itemType, id: itemType.id });
          } catch (error) {
            failed.push({
              itemType,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Commit the batch if there are operations to commit
        if (batchCount > 0) {
          await batch.commit();
          console.log(`✅ Successfully added ${batchCount} item types to Firestore`);
        }
      }

      console.log(`🎯 Bulk add completed: ${successful.length} successful, ${failed.length} failed`);
      return { successful, failed };

    } catch (error) {
      console.error('❌ Error bulk adding item types:', error);
      
      // Mark all as failed if batch operation fails
      const allFailed = itemTypes.map(itemType => ({
        itemType,
        error: error instanceof Error ? error.message : 'Batch operation failed'
      }));

      return { successful: [], failed: allFailed };
    }
  }

  /**
   * Add a single item type to the collection
   */
  static async addItemType(itemType: ItemType): Promise<ItemTypeOperationResult> {
    try {
      // Validate required fields
      if (!itemType.id || !itemType.category || !itemType.model) {
        return {
          success: false,
          message: 'Missing required fields: id, category, or model',
          error: 'VALIDATION_ERROR'
        };
      }

      // Create item type document with timestamps
      const itemTypeDoc = {
        ...itemType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_ITEM_TYPES_COLLECTION, itemType.id);
      await setDoc(docRef, itemTypeDoc);

      console.log(`✅ Successfully added item type: ${itemType.model} (${itemType.id})`);
      return {
        success: true,
        message: `Successfully added item type: ${itemType.model}`,
        itemTypeId: itemType.id
      };

    } catch (error) {
      console.error('❌ Error adding item type:', error);
      return {
        success: false,
        message: 'Failed to add item type. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all item types from the collection
   */
  static async getAllItemTypes(): Promise<ItemType[]> {
    try {
      const itemTypesCollection = collection(db, ADMIN_CONFIG.FIRESTORE_ITEM_TYPES_COLLECTION);
      const snapshot = await getDocs(itemTypesCollection);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ItemType[];

    } catch (error) {
      console.error('❌ Error fetching item types:', error);
      return [];
    }
  }

  /**
   * Check if the itemTypes collection is empty
   */
  static async isCollectionEmpty(): Promise<boolean> {
    try {
      const itemTypes = await this.getAllItemTypes();
      return itemTypes.length === 0;
    } catch (error) {
      console.error('❌ Error checking collection status:', error);
      return true; // Assume empty on error
    }
  }

  /**
   * Get item types by category
   */
  static async getItemTypesByCategory(category: string): Promise<ItemType[]> {
    try {
      const allItemTypes = await this.getAllItemTypes();
      return allItemTypes.filter(item => item.category === category);
    } catch (error) {
      console.error('❌ Error fetching item types by category:', error);
      return [];
    }
  }

  /**
   * Get item types by assignment type
   */
  static async getItemTypesByAssignmentType(assignmentType: 'team' | 'personal'): Promise<ItemType[]> {
    try {
      const allItemTypes = await this.getAllItemTypes();
      return allItemTypes.filter(item => item.assignmentType === assignmentType);
    } catch (error) {
      console.error('❌ Error fetching item types by assignment type:', error);
      return [];
    }
  }
}