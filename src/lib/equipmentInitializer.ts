/**
 * Equipment Database Initializer
 * Seeds the equipmentTemplates collection with predefined equipment types
 * 
 * NOTE: EQUIPMENT_TEMPLATES has been removed - templates are now managed through the UI
 * This file is deprecated and kept for backward compatibility only
 */

import { EquipmentService } from './equipmentService';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * Initialize equipment types in Firestore from templates
 * @deprecated Templates are now managed through the UI - use TemplateManagementTab instead
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function initializeEquipmentTypes(allowDuplicateHandling: boolean = true): Promise<{
  success: boolean;
  message: string;
  addedCount?: number;
  error?: string;
}> {
  console.warn('initializeEquipmentTypes is deprecated - templates are now managed through the UI');
  
  try {
    // Check if any templates already exist
    const existingTemplates = await EquipmentService.Types.getEquipmentTypes();
    
    if (existingTemplates.success && existingTemplates.totalCount > 0) {
      return {
        success: true,
        message: `Templates already exist: ${existingTemplates.totalCount} templates found`,
        addedCount: 0
      };
    }
    
    return {
      success: false,
      message: 'No templates to seed - please create templates through the UI',
      addedCount: 0,
      error: 'EQUIPMENT_TEMPLATES array has been removed - use the Template Management UI'
    };
    
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
export async function checkEquipmentTypesInitialized(checkTestTypes: boolean = false): Promise<boolean> {
  try {
    const result = await EquipmentService.Types.getEquipmentTypes();
    if (!result.success || result.totalCount === 0) {
      return false;
    }
    
    // If checking for test types, verify that we have TEST- prefixed types
    if (checkTestTypes) {
      const hasTestTypes = result.equipmentTypes.some(type => type.id.startsWith('TEST-'));
      return hasTestTypes;
    }
    
    return true;
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

const equipmentInitializer = {
  initializeEquipmentTypes,
  checkEquipmentTypesInitialized,
  getEquipmentTypeStats
};

export default equipmentInitializer;


