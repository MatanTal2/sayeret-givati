/**
 * Equipment Templates for Quick Equipment Creation
 * Pre-defined configurations for common military equipment
 */

import { EquipmentStatus, EquipmentCondition, EquipmentType } from '@/types/equipment';

// EquipmentTemplate extends EquipmentType but allows for template-specific data
export interface EquipmentTemplate extends Omit<EquipmentType, 'createdAt' | 'updatedAt' | 'isActive' | 'sortOrder'> {
  // Template-specific fields that differ from EquipmentType
  productName: string; // For backwards compatibility in templates
}

/**
 * Pre-defined Equipment Templates
 * Based on common military equipment in IDF units
 */
export const EQUIPMENT_TEMPLATES: EquipmentTemplate[] = [
  // Weapons
  {
    id: 'rifle_m4',
    name: 'רובה M4A1',
    nameEnglish: 'M4A1 Rifle',
    description: 'רובה סער M4A1 סטנדרטי',
    category: 'נשק אישי',
    productName: 'רובה M4A1',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.GOOD,
    defaultLocation: 'מחסן נשק',
    idPrefix: 'M4',
    icon: '🔫',
    requiresApproval: true,
    maintenanceInterval: 7, // Weekly maintenance checks
    averageLifespan: 120, // 10 years
    commonNotes: 'בדיקת תקינות שבועית נדרשת',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },
  {
    id: 'rifle_tavor',
    name: 'רובה תבור',
    nameEnglish: 'Tavor TAR-21',
    description: 'רובה סער תבור TAR-21',
    category: 'נשק אישי',
    productName: 'רובה תבור TAR-21',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.GOOD,
    defaultLocation: 'מחסן נשק',
    idPrefix: 'TAR',
    icon: '🔫',
    requiresApproval: true,
    maintenanceInterval: 7, // Weekly maintenance checks
    averageLifespan: 120, // 10 years
    commonNotes: 'ניקוי יומי נדרש',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },
  {
    id: 'pistol_glock',
    name: 'אקדח גלוק',
    description: 'אקדח גלוק 17',
    category: 'נשק אישי',
    productName: 'אקדח גלוק 17',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.GOOD,
    defaultLocation: 'כספת נשק',
    idPrefix: 'GLK',
    icon: '🔫',
    commonNotes: 'נשק קצינים - אחסון בכספת',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },

  // Optics & Electronics
  {
    id: 'nvg_standard',
    name: 'משקפי ראיית לילה',
    description: 'משקפי ראיית לילה דור 3',
    category: 'אופטיקה',
    productName: 'משקפי ראיית לילה AN/PVS-14',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.EXCELLENT,
    defaultLocation: 'מחסן אופטיקה',
    idPrefix: 'NVG',
    icon: '🔭',
    commonNotes: 'בדיקת תקינות לפני כל שימוש',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },
  {
    id: 'thermal_sight',
    name: 'כוונת תרמית',
    description: 'כוונת תרמית FLIR',
    category: 'אופטיקה',
    productName: 'כוונת תרמית FLIR Scout',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.GOOD,
    defaultLocation: 'מחסן אופטיקה',
    idPrefix: 'THM',
    icon: '🔭',
    commonNotes: 'טעינת סוללה לפני שימוש',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },

  // Communications
  {
    id: 'radio_prc148',
    name: 'קשר PRC-148',
    description: 'קשר אלחוטי PRC-148',
    category: 'תקשורת',
    productName: 'קשר אלחוטי PRC-148',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.GOOD,
    defaultLocation: 'חדר תקשורת',
    idPrefix: 'RAD',
    icon: '📡',
    commonNotes: 'בדיקת תקשורת יומית',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },
  {
    id: 'radio_prc152',
    name: 'קשר PRC-152',
    description: 'קשר אלחוטי PRC-152 מתקדם',
    category: 'תקשורת',
    productName: 'קשר אלחוטי PRC-152',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.EXCELLENT,
    defaultLocation: 'חדר תקשורת',
    idPrefix: 'RAD',
    icon: '📡',
    commonNotes: 'קשר מפקדים - הצפנה מלאה',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },

  // Protective Equipment
  {
    id: 'vest_standard',
    name: 'אפוד מגן',
    description: 'אפוד מגן קרמי סטנדרטי',
    category: 'הגנה אישית',
    productName: 'אפוד מגן קרמי Level IIIA',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.GOOD,
    defaultLocation: 'מחסן ציוד',
    idPrefix: 'VEST',
    icon: '🛡️',
    commonNotes: 'בדיקת שלמות פלטים',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },
  {
    id: 'helmet_standard',
    name: 'קסדה',
    description: 'קסדה בליסטית ACH',
    category: 'הגנה אישית',
    productName: 'קסדה בליסטית ACH',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.GOOD,
    defaultLocation: 'מחסן ציוד',
    idPrefix: 'HELM',
    icon: '⛑️',
    commonNotes: 'בדיקת רצועות ומערכת הידוק',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },

  // Equipment & Gear
  {
    id: 'backpack_assault',
    name: 'תיק קרבי',
    description: 'תיק קרבי 40 ליטר',
    category: 'ציוד אישי',
    productName: 'תיק קרבי 40L',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.GOOD,
    defaultLocation: 'מחסן ציוד',
    idPrefix: 'BAG',
    icon: '🎒',
    commonNotes: 'בדיקת רוכסנים ורצועות',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },
  {
    id: 'sleeping_bag',
    name: 'שק שינה',
    description: 'שק שינה צבאי חורף',
    category: 'ציוד אישי',
    productName: 'שק שינה צבאי -10°C',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.GOOD,
    defaultLocation: 'מחסן ציוד',
    idPrefix: 'SLEEP',
    icon: '🛏️',
    commonNotes: 'ניקוי לאחר שימוש',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },

  // Vehicles & Heavy Equipment
  {
    id: 'vehicle_humvee',
    name: 'רכב הממר',
    description: 'רכב הממר M1114',
    category: 'רכבים',
    productName: 'הממר M1114 משוריין',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.GOOD,
    defaultLocation: 'חניון כלי רכב',
    idPrefix: 'VEH',
    icon: '🚗',
    commonNotes: 'בדיקה יומית של נוזלים וצמיגים',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  },

  // Medical Equipment
  {
    id: 'medkit_ifak',
    name: 'ערכת עזרה ראשונה',
    description: 'ערכת IFAK אישית',
    category: 'ציוד רפואי',
    productName: 'ערכת IFAK מלאה',
    defaultStatus: EquipmentStatus.AVAILABLE,
    defaultCondition: EquipmentCondition.NEW,
    defaultLocation: 'מחסן רפואי',
    idPrefix: 'MED',
    icon: '🏥',
    commonNotes: 'בדיקת תאריכי תפוגה חודשית',
    customizableFields: {
      serialNumber: true,
      currentHolder: true,
      assignedUnit: true,
      location: true,
      status: true,
      condition: true,
      notes: true
    }
  }
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(): Record<string, EquipmentTemplate[]> {
  const categories: Record<string, EquipmentTemplate[]> = {};
  
  EQUIPMENT_TEMPLATES.forEach(template => {
    if (!categories[template.category]) {
      categories[template.category] = [];
    }
    categories[template.category].push(template);
  });
  
  return categories;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): EquipmentTemplate | undefined {
  return EQUIPMENT_TEMPLATES.find(template => template.id === id);
}

/**
 * Generate next serial number for a template
 */
export function generateSerialNumber(template: EquipmentTemplate): string {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits
  return `${template.idPrefix}-${timestamp}`;
}

/**
 * Create equipment data from template
 */
export function createEquipmentFromTemplate(
  template: EquipmentTemplate,
  customValues: Partial<{
    serialNumber: string;
    currentHolder: string;
    assignedUnit: string;
    location: string;
    status: EquipmentStatus;
    condition: EquipmentCondition;
    notes: string;
  }> = {}
) {
  return {
    id: customValues.serialNumber || generateSerialNumber(template),
    productName: template.productName,
    category: template.category,
    currentHolder: customValues.currentHolder || '',
    assignedUnit: customValues.assignedUnit || '',
    location: customValues.location || template.defaultLocation,
    status: customValues.status || template.defaultStatus,
    condition: customValues.condition || template.defaultCondition,
    notes: customValues.notes || template.commonNotes || '',
    dateSigned: new Date().toISOString(),
    lastReportUpdate: new Date().toISOString(),
    signedBy: 'מערכת',
    trackingHistory: []
  };
}
