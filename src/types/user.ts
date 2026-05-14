/**
 * User-related TypeScript interfaces and types
 */

import { Timestamp } from 'firebase/firestore';
import { UserRole } from '@/types/equipment';
import type { ActiveGrant } from '@/types/permissionGrant';

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
  emailVerified?: boolean;
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

  // Team assignment (used by equipment scope queries)
  teamId?: string;

  // Enlistment cycle: ISO YYYY-MM (e.g. "2010-03" for March 2010).
  // Stored as a plain string so it survives Firestore JSON round-trips and
  // doesn't introduce timezone ambiguity (no day/hour component).
  enlistmentCycle?: string;

  // Mailing / home address. Free-form text. Used by the phone book Phase 2
  // categorization (Address/City) when that lands.
  address?: string;

  // Active permission grants (temporary role bumps). Server-loaded only;
  // client-side EnhancedAuthUser instances leave this undefined.
  grants?: ActiveGrant[];

  // Communication preferences
  communicationPreferences?: CommunicationPreferences;

  // Account-deletion soft-delete marker (PR-G). Present iff the user has
  // requested deletion and the 30d retention window hasn't elapsed (or
  // they haven't cancelled). Drives the in-app pending-deletion banner.
  deletionRequestedAt?: Timestamp;

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
  teamId?: string;
  enlistmentCycle?: string;
  address?: string;
  communicationPreferences?: CommunicationPreferences;
  /** PR-G soft-delete marker. Mirrored to {@link EnhancedAuthUser.deletionRequestedAt}. */
  deletionRequestedAt?: Timestamp;
  /** Optional free-text reason captured at delete-request time. */
  deletionReason?: string;
}

/**
 * Result of user data fetch operation
 */
export interface UserFetchResult {
  success: boolean;
  userData?: FirestoreUserProfile;
  error?: string;
}