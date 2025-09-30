/**
 * Categories Service Constants
 */

// Firestore collection names
export const COLLECTIONS = {
  CATEGORIES: 'categories',
  SUBCATEGORIES: 'subcategories'
} as const;

// Default values
export const DEFAULTS = {
  CREATED_BY: 'system',
  ORDER: 0,
  IS_ACTIVE: true
} as const;

// Error messages
export const ERROR_MESSAGES = {
  CATEGORY_EXISTS: 'קטגוריה עם שם זה כבר קיימת',
  SUBCATEGORY_EXISTS: 'תת-קטגוריה עם שם זה כבר קיימת',
  PARENT_CATEGORY_NOT_FOUND: 'קטגוריית האב לא נמצאה',
  CATEGORY_NOT_FOUND: 'הקטגוריה לא נמצאה',
  SUBCATEGORY_NOT_FOUND: 'התת-קטגוריה לא נמצאה',
  CREATION_FAILED: 'שגיאה ביצירה',
  UPDATE_FAILED: 'שגיאה בעדכון',
  DELETION_FAILED: 'שגיאה בהסרה',
  FETCH_FAILED: 'שגיאה בטעינת הנתונים',
  UNKNOWN_ERROR: 'שגיאה לא ידועה'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CATEGORY_CREATED: 'קטגוריה נוצרה בהצלחה',
  SUBCATEGORY_CREATED: 'תת-קטגוריה נוצרה בהצלחה',
  CATEGORY_UPDATED: 'קטגוריה עודכנה בהצלחה',
  SUBCATEGORY_UPDATED: 'תת-קטגוריה עודכנה בהצלחה',
  CATEGORY_DELETED: 'קטגוריה הוסרה בהצלחה',
  SUBCATEGORY_DELETED: 'תת-קטגוריה הוסרה בהצלחה'
} as const;
