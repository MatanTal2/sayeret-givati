/**
 * Equipment Database Initializer
 * Seeds the equipments collection with predefined equipment types
 */

import { EquipmentService } from './equipmentService';
import { EQUIPMENT_TEMPLATES } from '@/data/equipmentTemplates';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * Initialize equipment types in Firestore from templates
 * This should be called once to populate the equipments collection
 */
export async function initializeEquipmentTypes(): Promise<{
  success: boolean;
  message: string;
  addedCount?: number;
  error?: string;
}> {
  try {
    console.log(TEXT_CONSTANTS.FEATURES.EQUIPMENT.SEEDING_EQUIPMENT_TYPES);
    
    const result = await EquipmentService.seedEquipmentTypes(EQUIPMENT_TEMPLATES);
    
    if (result.success) {
      console.log(TEXT_CONSTANTS.FEATURES.EQUIPMENT.SEED_COMPLETE, result.data?.addedCount);
      return {
        success: true,
        message: `${TEXT_CONSTANTS.FEATURES.EQUIPMENT.SEED_COMPLETE} - ${result.data?.addedCount} types added`,
        addedCount: result.data?.addedCount
      };
    } else {
      console.error('Failed to seed equipment types:', result.error);
      return {
        success: false,
        message: result.message,
        error: result.error
      };
    }
    
  } catch (error) {
    console.error('Error during equipment initialization:', error);
    return {
      success: false,
      message: TEXT_CONSTANTS.ERRORS.UNEXPECTED_ERROR || 'Initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if equipment types are already initialized
 */
export async function checkEquipmentTypesInitialized(): Promise<boolean> {
  try {
    const result = await EquipmentService.Types.getEquipmentTypes();
    return result.success && result.totalCount > 0;
  } catch (error) {
    console.error('Error checking equipment types:', error);
    return false;
  }
}

/**
 * Get equipment type statistics
 */
export async function getEquipmentTypeStats(): Promise<{
  total: number;
  active: number;
  categories: Record<string, number>;
}> {
  try {
    const allResult = await EquipmentService.Types.getEquipmentTypes({ activeOnly: false });
    const activeResult = await EquipmentService.Types.getEquipmentTypes({ activeOnly: true });
    
    // Count by categories
    const categories: Record<string, number> = {};
    if (allResult.success) {
      allResult.equipmentTypes.forEach(type => {
        categories[type.category] = (categories[type.category] || 0) + 1;
      });
    }
    
    return {
      total: allResult.success ? allResult.totalCount : 0,
      active: activeResult.success ? activeResult.totalCount : 0,
      categories
    };
    
  } catch (error) {
    console.error('Error getting equipment type stats:', error);
    return {
      total: 0,
      active: 0,
      categories: {}
    };
  }
}

export default {
  initializeEquipmentTypes,
  checkEquipmentTypesInitialized,
  getEquipmentTypeStats
};


