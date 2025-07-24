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
}

export interface AuthorizedPersonnel {
  id?: string;
  militaryPersonalNumberHash: string;
  salt: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  rank: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface HashResult {
  hash: string;
  salt: string;
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
export type AdminTabType = 'add-personnel' | 'view-personnel' | 'system-stats';

export interface SystemStats {
  authorizedPersonnelCount: number;
  registeredUsersCount: number;
  recentActivityCount: number;
  lastUpdated: Date;
}

// Military rank enum
export const MILITARY_RANKS = [
  'טוראי',
  'רב טוראי', 
  'סמל',
  'רב סמל',
  'סמל ראשון',
  'רס״ן',
  'סגן',
  'סרן',
  'רס״ר',
  'סא״ל'
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
