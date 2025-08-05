/**
 * User-related TypeScript interfaces and types
 */

import { Timestamp } from 'firebase/firestore';
import { UserRole } from '@/types/equipment';

/**
 * Enhanced AuthUser interface that includes Firestore user data
 */
export interface EnhancedAuthUser {
  // Firebase Auth fields
  uid: string;
  email?: string;
  displayName?: string;
  userType: 'admin' | 'personnel' | null;
  
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
  role: UserRole;
  status: 'active' | 'inactive' | 'transferred' | 'discharged';
  militaryPersonalNumberHash: string;
  permissions: string[];
  joinDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profileImage?: string;
  testUser?: boolean;
}

/**
 * Result of user data fetch operation
 */
export interface UserFetchResult {
  success: boolean;
  userData?: FirestoreUserProfile;
  error?: string;
}