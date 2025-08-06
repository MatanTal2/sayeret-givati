// Equipment Validation Utilities
// Reusable validation functions for forms and data integrity

import { 
  // Equipment,            // Commented out - used by legacy functions
  NewEquipmentForm,
  // TransferEquipmentForm,  // Commented out - used by legacy functions
  // BulkTransferForm,     // Commented out - used by legacy functions
  EquipmentCondition
  // EquipmentStatus,      // Commented out - used by legacy functions
  // UserRole              // Commented out - used by legacy functions
} from '../types/equipment';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

/**
 * Validates new equipment form data
 */
export function validateNewEquipmentForm(form: Partial<NewEquipmentForm>): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Equipment ID validation
  if (!form.id?.trim()) {
    errors.id = 'מספר סידורי חובה';
  } else {
    const idValidation = validateEquipmentId(form.id);
    if (!idValidation.isValid) {
      errors.id = idValidation.error!;
    }
  }

  // Product name validation
  if (!form.productName?.trim()) {
    errors.productName = 'שם הפריט חובה';
  } else if (form.productName.trim().length < 2) {
    errors.productName = 'שם הפריט חייב להכיל לפחות 2 תווים';
  } else if (form.productName.trim().length > 100) {
    errors.productName = 'שם הפריט ארוך מדי (מקסימום 100 תווים)';
  }

  // Category validation
  if (!form.category?.trim()) {
    errors.category = 'קטגוריה חובה';
  } else if (form.category.trim().length < 2) {
    errors.category = 'קטגוריה חייבת להכיל לפחות 2 תווים';
  }

  // Unit validation
  if (!form.assignedUnit?.trim()) {
    errors.assignedUnit = 'יחידה חובה';
  } else if (form.assignedUnit.trim().length < 2) {
    errors.assignedUnit = 'שם יחידה חייב להכיל לפחות 2 תווים';
  }

  // Location validation
  if (!form.location?.trim()) {
    errors.location = 'מיקום חובה';
  } else if (form.location.trim().length < 2) {
    errors.location = 'מיקום חייב להכיל לפחות 2 תווים';
  }

  // Condition validation
  if (!form.condition) {
    errors.condition = 'מצב הציוד חובה';
  } else if (!Object.values(EquipmentCondition).includes(form.condition)) {
    errors.condition = 'מצב ציוד לא תקין';
  }

  // Notes validation (optional but with limits)
  if (form.notes && form.notes.trim().length > 500) {
    errors.notes = 'הערות ארוכות מדי (מקסימום 500 תווים)';
  }

  // Warnings for best practices
  if (form.condition === EquipmentCondition.POOR || form.condition === EquipmentCondition.DAMAGED) {
    warnings.condition = 'ציוד במצב גרוע או פגום - שקלו תחזוקה';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: Object.keys(warnings).length > 0 ? warnings : undefined
  };
}

/**
 * Validates equipment transfer form data
 * NOTE: This function is for legacy Equipment schema - currently disabled
 */
/*
export function validateTransferForm(
  form: Partial<TransferEquipmentForm>,
  currentEquipment: Equipment,
  userRole: UserRole
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // New holder validation
  if (!form.newHolder?.trim()) {
    errors.newHolder = 'מחזיק חדש חובה';
  } else if (form.newHolder.trim().length < 2) {
    errors.newHolder = 'שם מחזיק חייב להכיל לפחות 2 תווים';
  } else if (form.newHolder.trim() === currentEquipment.currentHolder) {
    errors.newHolder = 'מחזיק חדש חייב להיות שונה מהמחזיק הנוכחי';
  }

  // Unit validation (optional)
  if (form.newUnit && form.newUnit.trim().length < 2) {
    errors.newUnit = 'שם יחידה חייב להכיל לפחות 2 תווים';
  }

  // Location validation (optional)
  if (form.newLocation && form.newLocation.trim().length < 2) {
    errors.newLocation = 'מיקום חייב להכיל לפחות 2 תווים';
  }

  // Notes validation (optional)
  if (form.notes && form.notes.trim().length > 500) {
    errors.notes = 'הערות ארוכות מדי (מקסימום 500 תווים)';
  }

  // Equipment status checks
  if (currentEquipment.status === EquipmentStatus.LOST) {
    errors.general = 'לא ניתן להעביר ציוד שמסומן כאבוד';
  }

  if (currentEquipment.status === EquipmentStatus.RETIRED) {
    errors.general = 'לא ניתן להעביר ציוד שהוצא משירות';
  }

  if (currentEquipment.status === EquipmentStatus.PENDING_TRANSFER) {
    warnings.general = 'ציוד כבר בתהליך העברה';
  }

  // Role-based validations
  if (userRole === UserRole.SOLDIER && form.requiresApproval === false) {
    errors.approval = 'חייל לא יכול לבצע העברה ללא אישור';
  }

  // Condition warnings
  if (currentEquipment.condition === EquipmentCondition.BROKEN) {
    warnings.condition = 'ציוד שבור - וודאו שהמחזיק החדש מודע למצב';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: Object.keys(warnings).length > 0 ? warnings : undefined
  };
}
*/

/**
 * Validates bulk transfer form data
 */
/* Disabled - legacy Equipment schema
export function validateBulkTransferForm(
  form: Partial<BulkTransferForm>,
  equipmentList: Equipment[],
  userRole: UserRole
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Equipment IDs validation
  if (!form.equipmentIds || form.equipmentIds.length === 0) {
    errors.equipmentIds = 'חובה לבחור לפחות פריט אחד';
  } else if (form.equipmentIds.length > 50) {
    errors.equipmentIds = 'לא ניתן להעביר יותר מ-50 פריטים בבת אחת';
  }

  // New holder validation
  if (!form.newHolder?.trim()) {
    errors.newHolder = 'מחזיק חדש חובה';
  } else if (form.newHolder.trim().length < 2) {
    errors.newHolder = 'שם מחזיק חייב להכיל לפחות 2 תווים';
  }

  // Unit validation (optional)
  if (form.newUnit && form.newUnit.trim().length < 2) {
    errors.newUnit = 'שם יחידה חייב להכיל לפחות 2 תווים';
  }

  // Location validation (optional)
  if (form.newLocation && form.newLocation.trim().length < 2) {
    errors.newLocation = 'מיקום חייב להכיל לפחות 2 תווים';
  }

  // Notes validation (optional)
  if (form.notes && form.notes.trim().length > 500) {
    errors.notes = 'הערות ארוכות מדי (מקסימום 500 תווים)';
  }

  // Role-based validations
  if (userRole === UserRole.SOLDIER) {
    errors.permission = 'חייל לא יכול לבצע העברות מרובות';
  }

  // Validate each equipment item
  if (form.equipmentIds) {
    const problematicItems: string[] = [];
    const brokenItems: string[] = [];
    
    form.equipmentIds.forEach(id => {
      const equipment = equipmentList.find(item => item.id === id);
      if (equipment) {
        if (equipment.status === EquipmentStatus.LOST || 
            equipment.status === EquipmentStatus.RETIRED) {
          problematicItems.push(equipment.id);
        }
        if (equipment.condition === EquipmentCondition.BROKEN) {
          brokenItems.push(equipment.id);
        }
        if (equipment.currentHolder === form.newHolder?.trim()) {
          errors.equipmentIds = `פריט ${equipment.id} כבר נמצא אצל ${form.newHolder}`;
        }
      }
    });

    if (problematicItems.length > 0) {
      errors.equipmentIds = `הפריטים הבאים לא ניתנים להעברה: ${problematicItems.join(', ')}`;
    }

    if (brokenItems.length > 0) {
      warnings.condition = `הפריטים הבאים שבורים: ${brokenItems.join(', ')}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: Object.keys(warnings).length > 0 ? warnings : undefined
  };
}
*/

/**
 * Validates equipment ID format
 */
export function validateEquipmentId(id: string): { isValid: boolean; error?: string } {
  if (!id.trim()) {
    return { isValid: false, error: 'מספר סידורי חובה' };
  }

  const trimmedId = id.trim();

  if (trimmedId.length < 3) {
    return { isValid: false, error: 'מספר סידורי חייב להכיל לפחות 3 תווים' };
  }

  if (trimmedId.length > 50) {
    return { isValid: false, error: 'מספר סידורי ארוך מדי (מקסימום 50 תווים)' };
  }

  // Check for valid characters (alphanumeric + hyphens + underscores)
  const validPattern = /^[A-Za-z0-9\-_]+$/;
  if (!validPattern.test(trimmedId)) {
    return { isValid: false, error: 'מספר סידורי יכול להכיל רק אותיות, ספרות, מקפים וקווים תחתונים' };
  }

  // Check for common military equipment patterns (can be customized)
  const militaryPatterns = [
    /^[A-Z]{1,4}-\d{4,8}$/, // Format: ABC-12345
    /^[A-Z]{2,4}\d{4,8}$/, // Format: ABC12345
    /^\d{6,10}$/, // Format: 123456789
    /^[A-Z]{1,2}\d{2,4}-\d{3,6}$/ // Format: A12-345
  ];

  const matchesPattern = militaryPatterns.some(pattern => pattern.test(trimmedId));
  if (!matchesPattern) {
    return { 
      isValid: false, 
      error: 'מספר סידורי לא תואם לפורמט צבאי סטנדרטי (למשל: M4-12345, RAD5678)' 
    };
  }

  return { isValid: true };
}

/**
 * Validates user name
 */
export function validateUserName(name: string): { isValid: boolean; error?: string } {
  if (!name.trim()) {
    return { isValid: false, error: 'שם חובה' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'שם חייב להכיל לפחות 2 תווים' };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: 'שם ארוך מדי (מקסימום 50 תווים)' };
  }

  // Check for valid name characters (Hebrew, English, spaces, dots)
  const validNamePattern = /^[א-תA-Za-z\s\.]+$/;
  if (!validNamePattern.test(trimmedName)) {
    return { isValid: false, error: 'שם יכול להכיל רק אותיות עבריות, אנגליות, רווחים ונקודות' };
  }

  return { isValid: true };
}

/**
 * Validates phone number for OTP
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
  if (!phone.trim()) {
    return { isValid: false, error: 'מספר טלפון חובה' };
  }

  const trimmedPhone = phone.trim();

  // Israeli phone number pattern
  const israeliPhonePattern = /^(\+972|972|0)([5-9]\d{8})$/;
  
  if (!israeliPhonePattern.test(trimmedPhone.replace(/[\s\-]/g, ''))) {
    return { isValid: false, error: 'מספר טלפון לא תקין (פורמט ישראלי נדרש)' };
  }

  return { isValid: true };
}

/**
 * Validates unit name
 */
export function validateUnitName(unit: string): { isValid: boolean; error?: string } {
  if (!unit.trim()) {
    return { isValid: false, error: 'שם יחידה חובה' };
  }

  const trimmedUnit = unit.trim();

  if (trimmedUnit.length < 2) {
    return { isValid: false, error: 'שם יחידה חייב להכיל לפחות 2 תווים' };
  }

  if (trimmedUnit.length > 100) {
    return { isValid: false, error: 'שם יחידה ארוך מדי (מקסימום 100 תווים)' };
  }

  return { isValid: true };
}

/**
 * Validates location
 */
export function validateLocation(location: string): { isValid: boolean; error?: string } {
  if (!location.trim()) {
    return { isValid: false, error: 'מיקום חובה' };
  }

  const trimmedLocation = location.trim();

  if (trimmedLocation.length < 2) {
    return { isValid: false, error: 'מיקום חייב להכיל לפחות 2 תווים' };
  }

  if (trimmedLocation.length > 100) {
    return { isValid: false, error: 'מיקום ארוך מדי (מקסימום 100 תווים)' };
  }

  return { isValid: true };
}

/**
 * Validates notes field
 */
export function validateNotes(notes: string): { isValid: boolean; error?: string } {
  if (notes && notes.trim().length > 500) {
    return { isValid: false, error: 'הערות ארוכות מדי (מקסימום 500 תווים)' };
  }

  return { isValid: true };
}

/**
 * Validates retirement reason
 */
export function validateRetirementReason(reason: string): { isValid: boolean; error?: string } {
  if (!reason.trim()) {
    return { isValid: false, error: 'סיבה להוצאה משירות חובה' };
  }

  const trimmedReason = reason.trim();

  if (trimmedReason.length < 10) {
    return { isValid: false, error: 'סיבה חייבת להכיל לפחות 10 תווים' };
  }

  if (trimmedReason.length > 500) {
    return { isValid: false, error: 'סיבה ארוכה מדי (מקסימום 500 תווים)' };
  }

  return { isValid: true };
}

/**
 * Comprehensive form validation that combines all field validations
 */
export function validateForm<T extends Record<string, unknown>>(
  formData: T,
  validators: Record<keyof T, (value: unknown) => { isValid: boolean; error?: string }>
): ValidationResult {
  const errors: Record<string, string> = {};

  Object.entries(validators).forEach(([field, validator]) => {
    const result = validator(formData[field as keyof T]);
    if (!result.isValid && result.error) {
      errors[field] = result.error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
} 