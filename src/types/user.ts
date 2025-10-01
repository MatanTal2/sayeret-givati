/**
 * User-related TypeScript interfaces and types
 */

import { Timestamp } from 'firebase/firestore';
import { UserRole } from '@/types/equipment';

/**
 * User type enum for high-level categorization
 */
export enum UserType {
  ADMIN = 'admin',
  SYSTEM_MANAGER = 'system_manager', 
  MANAGER = 'manager',
  TEAM_LEADER = 'team_leader',
  USER = 'user'
}

/**
 * Communication preferences for user notifications and alerts
 */
export interface CommunicationPreferences {
  emailNotifications: boolean;
  equipmentTransferAlerts: boolean;
  systemUpdates: boolean;
  schedulingAlerts: boolean;
  emergencyNotifications: boolean;
  // Meta fields for tracking preference changes
  lastUpdated?: Timestamp;
  updatedBy?: string; // uid of user who made the change
}

/**
 * Enhanced AuthUser interface that includes Firestore user data
 */
export interface EnhancedAuthUser {
  // Firebase Auth fields
  uid: string;
  email?: string;
  displayName?: string;
  userType: UserType | null;
  
  // Firestore user profile fields
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthday?: Timestamp;
  phoneNumber?: string;
  rank?: string;
  role?: UserRole;
  status?: 'active' | 'inactive' | 'transferred' | 'discharged';
  militaryPersonalNumberHash?: string;
  permissions?: string[];
  joinDate?: Timestamp;
  profileImage?: string;
  testUser?: boolean;
  
  // Communication preferences
  communicationPreferences?: CommunicationPreferences;
  
  // Computed fields
  initials?: string;
}

/**
 * User profile data fetched from Firestore
 */
export interface FirestoreUserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthday: Timestamp;
  phoneNumber: string;
  rank: string;
  userType: UserType;
  role: UserRole;
  status: 'active' | 'inactive' | 'transferred' | 'discharged';
  militaryPersonalNumberHash: string;
  permissions: string[];
  joinDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profileImage?: string;
  testUser?: boolean;
  communicationPreferences?: CommunicationPreferences;
}

/**
 * Result of user data fetch operation
 */
export interface UserFetchResult {
  success: boolean;
  userData?: FirestoreUserProfile;
  error?: string;
}