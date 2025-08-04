import { Timestamp } from 'firebase/firestore';

// Admin authentication types
export interface AdminSession {
  email: string;
  loginTime: number;
  expires: number;
}

export interface AdminCredentials {
  email: string;
  password: string;
}

export interface AdminConfig {
  password: string;
  createdAt: Timestamp;
  createdBy: string;
  lastUpdated: Timestamp;
}

// Personnel management types
export interface PersonnelFormData {
  militaryPersonalNumber: string;
  firstName: string;
  lastName: string;
  rank: string;
  phoneNumber: string;
  email: string; // Personal email for Firebase Authentication (NOT military)
}

// Unified interface for authorized personnel data (used by both single add and bulk CSV)
export interface AuthorizedPersonnelData {
  militaryPersonalNumber: string;
  firstName: string;
  lastName: string;
  rank: string;
  phoneNumber: string;
  // No email - this is for pre-authorization only
}

export interface AuthorizedPersonnel {
  id?: string;
  militaryPersonalNumberHash: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  rank: string;
  email?: string; // Personal email for registration (added during user registration, not pre-auth)
  requestedRole?: string; // Role user requested during registration
  approvedRole: string; // Role approved by admin (defaults to 'soldier')
  roleStatus: 'pending' | 'approved' | 'rejected'; // Role approval status
  status: 'active' | 'inactive' | 'transferred' | 'discharged'; // Default: 'active'
  joinDate: Timestamp; // Registration date
  testUser?: boolean; // Flag for development/testing accounts
  createdAt: Timestamp;
  createdBy: string;
  approvedBy?: string; // Admin who approved the role
  approvedAt?: Timestamp; // When role was approved
}



// UI state types
export interface FormMessage {
  text: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
}

// Validation types
export interface ValidationRule {
  field: keyof PersonnelFormData;
  validator: (value: string) => string | null;
  required?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Admin dashboard types
export type AdminTabType = 'add-personnel' | 'bulk-upload' | 'view-personnel' | 'system-stats';

export interface SystemStats {
  authorizedPersonnelCount: number;
  registeredUsersCount: number;
  recentActivityCount: number;
  lastUpdated: Date;
}

// Military rank enum - Single source of truth
export const MILITARY_RANKS = [
  'סמל',
  'רב סמל',
  'סמל ראשון',
  'רס"ל',
  'רס"ר',
  'רס"מ',
  'סג"מ',
  'סגן',
  'סרן',
] as const;


export type MilitaryRank = typeof MILITARY_RANKS[number];

// Error types - AdminError class is defined in adminUtils.ts

// API response types
export interface AdminApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PersonnelOperationResult {
  success: boolean;
  personnel?: AuthorizedPersonnel;
  message: string;
  error?: Error;
} 

export interface BulkUploadResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: string[];
  successfulPersonnel: string[];
} 