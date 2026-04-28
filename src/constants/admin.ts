import { MILITARY_RANKS } from '@/types/admin';
import { UserType } from '@/types/user';

// Admin configuration
export const ADMIN_CONFIG = {
  EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@sayeretgivati.com', // Default fallback for development (fixed case)
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  SESSION_STORAGE_KEY: 'adminSession',
  FIRESTORE_ADMIN_COLLECTION: 'admin_config',
  FIRESTORE_ADMIN_DOC: 'system_admin',
  FIRESTORE_PERSONNEL_COLLECTION: 'authorized_personnel',
  FIRESTORE_USERS_COLLECTION: 'users'
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  MILITARY_ID: /^\d{5,7}$/,
  PHONE_NUMBER: /^(?:\+972-?|0)?(5[0-9])-?\d{7}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
} as const;

// Validation messages
export const VALIDATION_MESSAGES = {
  MILITARY_ID_REQUIRED: 'Military Personal Number is required',
  MILITARY_ID_INVALID: 'Military Personal Number must be 5-7 digits',
  MILITARY_ID_DUPLICATE: 'Military Personal Number already exists in the system',
  FIRST_NAME_REQUIRED: 'First name is required',
  LAST_NAME_REQUIRED: 'Last name is required',
  RANK_REQUIRED: 'Rank is required',
  PHONE_REQUIRED: 'Phone number is required',
  PHONE_INVALID: 'Phone number must be a valid Israeli mobile number (e.g., 050-1234567, +972-50-1234567, 501234567)',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Invalid email format',
  PASSWORD_REQUIRED: 'Password is required'
} as const;

// Success/Error messages
export const ADMIN_MESSAGES = {
  LOGIN_SUCCESS: 'התחברת בהצלחה ללוח האדמין',
  LOGIN_FAILED: 'התחברות נכשלה. בדוק את פרטי הזיהוי.',
  LOGIN_EMAIL_INVALID: 'כתובת דוא״ל לא חוקית',
  LOGIN_PASSWORD_INVALID: 'סיסמה לא חוקית',
  LOGIN_CONFIG_NOT_FOUND: 'הגדרות אדמין לא נמצאו. פנה למנהל המערכת.',
  LOGIN_CONNECTION_ERROR: 'התחברות נכשלה. בדוק את החיבור ונסה שוב.',

  PERSONNEL_ADD_SUCCESS: (name: string) => `✅ ${name} נוסף בהצלחה לרשימת הכוח אדם המורשה`,
  PERSONNEL_ADD_FAILED: '❌ הוספת כוח אדם נכשלה. בדוק את החיבור ונסה שוב.',
  PERSONNEL_DELETE_SUCCESS: (name: string) => `✅ ${name} הוסר בהצלחה מרשימת הכוח אדם המורשה`,
  PERSONNEL_DELETE_FAILED: '❌ הסרת כוח אדם נכשלה. נסה שוב.',
  
  SESSION_EXPIRED: 'תוקף ההפעלה פג. התחבר שוב.',
  LOGOUT_CONFIRM: 'האם להתנתק?'
} as const;

// Military ranks for dropdown
export const RANK_OPTIONS = MILITARY_RANKS.map(rank => ({
  value: rank,
  label: rank
}));

// User types for dropdown
export const USER_TYPE_OPTIONS = [
  { value: UserType.USER, label: 'משתמש' },
  { value: UserType.TEAM_LEADER, label: 'מפקד צוות' },
  { value: UserType.MANAGER, label: 'מנהל' },
  { value: UserType.SYSTEM_MANAGER, label: 'מנהל מערכת' },
  { value: UserType.ADMIN, label: 'אדמין' }
];

// Service status enum (matches AuthorizedPersonnel.status)
export const PERSONNEL_STATUSES = ['active', 'inactive', 'transferred', 'discharged'] as const;
export type PersonnelStatus = typeof PERSONNEL_STATUSES[number];

// Status options for dropdown — labels are read at usage site from TEXT_CONSTANTS
export const PERSONNEL_STATUS_OPTIONS: { value: PersonnelStatus; labelKey: 'STATUS_ACTIVE' | 'STATUS_INACTIVE' | 'STATUS_TRANSFERRED' | 'STATUS_DISCHARGED' }[] = [
  { value: 'active', labelKey: 'STATUS_ACTIVE' },
  { value: 'inactive', labelKey: 'STATUS_INACTIVE' },
  { value: 'transferred', labelKey: 'STATUS_TRANSFERRED' },
  { value: 'discharged', labelKey: 'STATUS_DISCHARGED' },
];

// Admin tabs configuration
export const ADMIN_TABS = [
  {
    id: 'add-personnel' as const,
    name: '🔐 הוספת כוח אדם מורשה',
    description: 'הוסף כוח אדם לרשימת המורשים. רק כוח אדם מורשה יכול להירשם במערכת.'
  },
  {
    id: 'bulk-upload' as const,
    name: '📁 העלאה מרובה',
    description: 'העלה כוח אדם מורשה במרוכז באמצעות קובץ CSV.'
  },
  {
    id: 'view-personnel' as const,
    name: '📋 צפייה בכוח אדם',
    description: 'צפייה וניהול רשימת הכוח אדם המורשה.'
  },
  {
    id: 'update-personnel' as const,
    name: '✏️ עדכון כוח אדם',
    description: 'חיפוש ועדכון פרטי כוח אדם — שם, דרגה, טלפון וסוג משתמש.'
  },
  {
    id: 'system-stats' as const,
    name: '📊 סטטיסטיקות מערכת',
    description: 'סקירה של נתוני המערכת ומצבה.'
  }
] as const;

// Security configuration
export const SECURITY_CONFIG = {
  HASH_ALGORITHM: 'SHA-256',
  SALT_LENGTH: 16,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_COOLDOWN: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8
} as const;

// Form constraints
export const FORM_CONSTRAINTS = {
  MILITARY_ID_MAX_LENGTH: 7,
  NAME_MAX_LENGTH: 50,
  PHONE_MAX_LENGTH: 20
} as const;

// Loading states
export const LOADING_OPERATIONS = {
  LOGIN: 'מאמת...',
  ADD_PERSONNEL: 'מוסיף כוח אדם...',
  DELETE_PERSONNEL: 'מסיר כוח אדם...',
  FETCH_PERSONNEL: 'טוען כוח אדם...',
  HASH_GENERATION: 'מחולל hash אבטחה...'
} as const; 