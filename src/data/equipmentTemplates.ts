/**
 * Equipment Templates for Quick Equipment Creation
 * Pre-defined configurations for common military equipment
 */

// No imports needed - EquipmentTemplate is now self-contained

// EquipmentTemplate now matches the simplified EquipmentType schema
export interface EquipmentTemplate {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description?: string;
  notes?: string;
  requiresDailyStatusCheck: boolean;
}

// EQUIPMENT_TEMPLATES removed - using only Firestore data as requested
// Templates are now managed entirely through the database

/**
 * Get templates by category (deprecated - use Firestore data)
 * @deprecated Use useTemplates hook with Firestore data instead
 */
export function getTemplatesByCategory(): Record<string, EquipmentTemplate[]> {
  console.warn('getTemplatesByCategory is deprecated - use Firestore data via useTemplates hook');
  return {};
}

/**
 * Get template by ID (deprecated - use Firestore data)
 * @deprecated Use useTemplates hook with Firestore data instead
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getTemplateById(id: string): EquipmentTemplate | undefined {
  console.warn('getTemplateById is deprecated - use Firestore data via useTemplates hook');
  return undefined;
}

/**
 * Generate next serial number for a template
 */
export function generateSerialNumber(template: EquipmentTemplate): string {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits
  const prefix = template.name.substring(0, 3).toUpperCase().replace(/\s/g, '');
  return `${prefix}-${timestamp}`;
}

/**
 * Create equipment data from template (legacy compatibility)
 * @deprecated Use the new EquipmentType format directly
 */
export function createEquipmentFromTemplate(
  template: EquipmentTemplate,
  customValues: Partial<{
    serialNumber: string;
    currentHolder: string;
    assignedUnit: string;
    location: string;
    notes: string;
  }> = {}
) {
  return {
    id: customValues.serialNumber || generateSerialNumber(template),
    equipmentType: template.id, // Reference to the template
    productName: template.name, // Use name as productName for compatibility
    category: template.category,
    currentHolder: customValues.currentHolder || '',
    assignedUnit: customValues.assignedUnit || '',
    location: customValues.location || 'מחסן', // Default location
    notes: customValues.notes || template.notes || '',
    requiresDailyStatusCheck: template.requiresDailyStatusCheck || false,
    dateSigned: new Date().toISOString(),
    lastReportUpdate: new Date().toISOString(),
    signedBy: 'מערכת',
    trackingHistory: []
  };
}
