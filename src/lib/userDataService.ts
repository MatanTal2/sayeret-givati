/**
 * Service for fetching and managing user data from Firestore
 */

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { FirestoreUserProfile, UserFetchResult } from '@/types/user';
import { ADMIN_CONFIG } from '@/constants/admin';

export class UserDataService {
  /**
   * Fetch user data from Firestore using email lookup
   * Uses indexed query for efficient searching
   */
  static async fetchUserDataByEmail(email: string): Promise<UserFetchResult> {
    try {
      console.log('🔍 Fetching user data for email:', email);

      // Query users collection with email index
      const usersCollection = collection(db, ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION);
      const q = query(
        usersCollection,
        where('email', '==', email),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('❌ No user found with email:', email);
        return {
          success: false,
          error: 'User not found in database'
        };
      }

      // Get the first (and should be only) document
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as FirestoreUserProfile;

      console.log('✅ User data fetched successfully:', {
        uid: userData.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
      });

      return {
        success: true,
        userData
      };

    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      return {
        success: false,
        error: 'Failed to fetch user data'
      };
    }
  }

  /**
   * Generate user initials from stored user data
   * Reuses existing logic pattern from AuthButton
   */
  static generateInitials(userData: FirestoreUserProfile): string {
    // Priority 1: Use firstName and lastName from Firestore
    if (userData.firstName && userData.lastName) {
      return `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase();
    }
    
    // Priority 2: Use email as fallback
    if (userData.email) {
      const emailInitial = userData.email.charAt(0).toUpperCase();
      return `${emailInitial}U`; // U for User
    }
    
    // Last resort: Default icon symbol
    return '👤';
  }

  /**
   * Generate display name for desktop greeting
   * Format: "lastName, שלום" or fallback to firstName
   */
  static generateDisplayName(userData: FirestoreUserProfile): string {
    if (userData.lastName) {
      return `${userData.lastName}, שלום`;
    }
    
    if (userData.firstName) {
      return userData.firstName;
    }
    
    // Fallback to email prefix
    return userData.email.split('@')[0];
  }

  /**
   * Get first name for display
   */
  static getFirstName(userData: FirestoreUserProfile): string {
    return userData.firstName || userData.email.split('@')[0];
  }
}