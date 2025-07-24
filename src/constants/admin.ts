import { MILITARY_RANKS } from '@/types/admin';

// Admin configuration
export const ADMIN_CONFIG = {
  EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@sayeretgivati.com', // Default fallback for development (fixed case)
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  SESSION_STORAGE_KEY: 'adminSession',
  FIRESTORE_ADMIN_COLLECTION: 'admin_config',
  FIRESTORE_ADMIN_DOC: 'system_admin',
  FIRESTORE_PERSONNEL_COLLECTION: 'authorized_personnel'
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  MILITARY_ID: /^\d{5,7}$/,
  PHONE_NUMBER: /^(?:\+972-?|0)(5[0-9])-?\d{7}$/,
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
  PHONE_INVALID: 'Phone number must be a valid Israeli mobile number (e.g., 050-1234567, +972-50-1234567)',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Invalid email format',
  PASSWORD_REQUIRED: 'Password is required'
} as const;

// Success/Error messages
export const ADMIN_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in to admin panel',
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  LOGIN_EMAIL_INVALID: 'Invalid admin email address',
  LOGIN_PASSWORD_INVALID: 'Invalid password',
  LOGIN_CONFIG_NOT_FOUND: 'Admin configuration not found. Please contact system administrator.',
  LOGIN_CONNECTION_ERROR: 'Login failed. Please check your connection and try again.',
  
  PERSONNEL_ADD_SUCCESS: (name: string) => `✅ Successfully added ${name} to authorized personnel list`,
  PERSONNEL_ADD_FAILED: '❌ Failed to add personnel. Please check your connection and try again.',
  PERSONNEL_DELETE_SUCCESS: (name: string) => `✅ Successfully removed ${name} from authorized personnel list`,
  PERSONNEL_DELETE_FAILED: '❌ Failed to remove personnel. Please try again.',
  
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  LOGOUT_CONFIRM: 'Are you sure you want to logout?'
} as const;

// Military ranks for dropdown
export const RANK_OPTIONS = MILITARY_RANKS.map(rank => ({
  value: rank,
  label: rank
}));

// Admin tabs configuration
export const ADMIN_TABS = [
  {
    id: 'add-personnel' as const,
    name: '🔐 Add Authorized Personnel',
    description: 'Add military personnel to the authorized list. Only authorized personnel can register in the system.'
  },
  {
    id: 'bulk-upload' as const,
    name: '📁 Bulk Upload',
    description: 'Upload multiple authorized personnel via CSV file for bulk operations.'
  },
  {
    id: 'view-personnel' as const,
    name: '📋 View Personnel', 
    description: 'View and manage authorized personnel list.'
  },
  {
    id: 'system-stats' as const,
    name: '📊 System Stats',
    description: 'Overview of system usage and status.'
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
  LOGIN: 'Authenticating...',
  ADD_PERSONNEL: 'Adding Personnel...',
  DELETE_PERSONNEL: 'Removing Personnel...',
  FETCH_PERSONNEL: 'Loading Personnel...',
  HASH_GENERATION: 'Generating Security Hash...'
} as const; 