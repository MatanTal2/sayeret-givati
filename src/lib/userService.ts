import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc, Timestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { SecurityUtils } from '@/lib/adminUtils';
import { UserRole } from '@/types/equipment';
import { CommunicationPreferences, UserType } from '@/types/user';
import { ADMIN_CONFIG } from '@/constants/admin';

/**
 * Interface for complete registration data including military ID
 */
export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthdate: string;
  phoneNumber: string;
  militaryPersonalNumber: string; // For linking to authorized_personnel
  firebaseAuthUid?: string; // Firebase Auth UID to use as document ID
}

/**
 * Interface for user profile document in Firestore
 */
export interface UserProfile {
  uid: string; // Firebase Auth UID (matches document ID)
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthday: Timestamp;
  phoneNumber: string;
  rank: string; // From authorized_personnel
  userType: UserType; // High-level user categorization
  role: UserRole; // Specific military role
  status: 'active' | 'inactive' | 'transferred' | 'discharged';
  militaryPersonalNumberHash: string; // Link to authorized_personnel
  permissions: string[];
  joinDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profileImage?: string;
  testUser?: boolean;
  communicationPreferences?: CommunicationPreferences;
}

/**
 * Result interface for user registration
 */
export interface UserRegistrationResult {
  success: boolean;
  uid?: string;
  message?: string;
  error?: string;
}

/**
 * User service class for handling user registration and profile management
 */
export class UserService {
  /**
   * Create a new user profile in Firestore using Firebase Auth UID as document ID
   */
  static async registerUser(registrationData: RegistrationData): Promise<UserRegistrationResult> {
    try {
      console.log('🚀 Starting user registration process');

      // 1. Validate Firebase Auth UID is provided
      if (!registrationData.firebaseAuthUid) {
        return {
          success: false,
          error: 'Firebase Auth UID is required for user registration.'
        };
      }

      // 2. Generate hash ID for military personal number (for authorized personnel lookup)
      const militaryIdHash = await SecurityUtils.hashMilitaryId(registrationData.militaryPersonalNumber);
      console.log('🔨 Generated military ID hash for authorized personnel lookup:', militaryIdHash);

      // 3. Check if user already exists in Firestore using Firebase Auth UID
      const existingUser = await this.checkUserExists(registrationData.firebaseAuthUid);
      if (existingUser) {
        console.log('📝 User profile already exists in Firestore with Firebase Auth UID:', registrationData.firebaseAuthUid);
        return {
          success: true,
          uid: registrationData.firebaseAuthUid,
          message: 'User profile already exists'
        };
      }

      // 4. Get authorized personnel data using military ID hash
      const authorizedPersonnel = await this.getAuthorizedPersonnelData(militaryIdHash);
      if (!authorizedPersonnel) {
        return {
          success: false,
          error: 'Military ID not found in authorized personnel. Registration not allowed.'
        };
      }

      // 5. Create user profile document in Firestore
      const defaultCommunicationPreferences: CommunicationPreferences = {
        emailNotifications: true, // Default to enabled for important system notifications
        equipmentTransferAlerts: true, // Default to enabled for equipment-related alerts
        systemUpdates: false, // Default to disabled for non-critical updates
        schedulingAlerts: true, // Default to enabled for scheduling notifications
        emergencyNotifications: true, // Always default to enabled for emergency alerts
        lastUpdated: serverTimestamp() as Timestamp,
        updatedBy: registrationData.firebaseAuthUid // Self-created during registration
      };

      const userProfile: UserProfile = {
        uid: registrationData.firebaseAuthUid, // Use Firebase Auth UID as document ID
        email: registrationData.email,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        gender: registrationData.gender,
        birthday: Timestamp.fromDate(new Date(registrationData.birthdate)),
        phoneNumber: registrationData.phoneNumber,
        rank: authorizedPersonnel.rank || '', // From authorized_personnel
        userType: authorizedPersonnel.userType || UserType.USER, // Use userType from authorized_personnel
        role: UserRole.SOLDIER, // Default military role
        status: 'active', // Default status
        militaryPersonalNumberHash: militaryIdHash, // Store military hash in field
        permissions: ['equipment:view'], // Default soldier permissions
        joinDate: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        communicationPreferences: defaultCommunicationPreferences
      };

      // 6. Save user profile to Firestore using Firebase Auth UID as document ID
      const userDocRef = doc(db, ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION, registrationData.firebaseAuthUid);
      await setDoc(userDocRef, userProfile);
      console.log('✅ User profile created in Firestore with Firebase Auth UID:', registrationData.firebaseAuthUid);

      // 7. Mark as registered in authorized_personnel collection
      await this.markAsRegistered(militaryIdHash);

      // Note: Firebase Auth user is created client-side, Firestore profile created server-side
      console.log('📝 Firebase Auth user and Firestore profile linked via UID:', registrationData.firebaseAuthUid);

      return {
        success: true,
        uid: registrationData.firebaseAuthUid,
        message: 'User profile created successfully'
      };

    } catch (error) {
      console.error('❌ Error during user registration:', error);
      
      return {
        success: false,
        error: 'Registration failed. Please try again or contact support.'
      };
    }
  }

  /**
   * Get authorized personnel data by military ID hash
   */
  private static async getAuthorizedPersonnelData(militaryIdHash: string): Promise<{ rank: string; userType?: UserType } | null> {
    try {
      const personnelDocRef = doc(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION, militaryIdHash);
      const personnelDoc = await getDoc(personnelDocRef);
      
      if (personnelDoc.exists()) {
        const data = personnelDoc.data();
        return {
          rank: data.rank || '',
          userType: data.userType || UserType.USER
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching authorized personnel data:', error);
      return null;
    }
  }

  /**
   * Check if a user profile exists by military ID hash
   */
  static async checkUserExists(militaryIdHash: string): Promise<boolean> {
    try {
      const userDocRef = doc(db, ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION, militaryIdHash);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Mark a user as fully registered in authorized_personnel collection
   */
  private static async markAsRegistered(militaryIdHash: string): Promise<void> {
    try {
      const personnelDocRef = doc(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION, militaryIdHash);
      await updateDoc(personnelDocRef, { 
        registered: true,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Marked user as registered in authorized_personnel');
    } catch (error) {
      console.error('⚠️ Failed to mark user as registered (non-critical):', error);
      // Don't throw error - this is a non-critical operation
    }
  }
}

/**
 * Interface for user search results
 */
export interface UserSearchResult {
  uid: string;
  displayName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  rank?: string;
  status?: string;
}

/**
 * Search users by name or email
 * Uses a simpler approach that works without composite indexes
 */
export async function searchUsers(searchQuery: string, limitCount: number = 10): Promise<UserSearchResult[]> {
  try {
    if (searchQuery.length < 2) {
      return [];
    }

    console.log('Searching for users with query:', searchQuery);

    const usersCollection = collection(db, 'users');
    
    // Get all active users and filter client-side
    // This is less efficient but works without complex indexes
    const q = query(
      usersCollection,
      where('status', '==', 'active'),
      limit(100) // Get more users to filter from
    );

    const querySnapshot = await getDocs(q);
    const results: UserSearchResult[] = [];
    const searchLower = searchQuery.toLowerCase().trim();

    console.log(`Found ${querySnapshot.docs.length} active users to search through`);

    querySnapshot.docs.forEach(doc => {
      try {
        const userData = doc.data() as UserProfile;
        
        // Create searchable text from user data
        const searchableText = [
          userData.firstName || '',
          userData.lastName || '',
          userData.email || '',
          `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
        ].join(' ').toLowerCase();

        // Check if search query matches any part of the user data
        if (searchableText.includes(searchLower)) {
          results.push({
            uid: doc.id,
            displayName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            email: userData.email || '',
            firstName: userData.firstName,
            lastName: userData.lastName,
            rank: userData.rank,
            status: userData.status
          });
        }
      } catch (error) {
        console.warn('Error processing user document:', doc.id, error);
      }
    });

    console.log(`Found ${results.length} matching users`);

    // If no results found and we're in development, add some mock users for testing
    if (results.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('No users found, adding mock users for development');
      const mockUsers: UserSearchResult[] = [
        {
          uid: 'mock-user-1',
          displayName: 'יוסי כהן',
          email: 'yossi.cohen@example.com',
          firstName: 'יוסי',
          lastName: 'כהן',
          rank: 'רב סמל',
          status: 'active'
        },
        {
          uid: 'mock-user-2',
          displayName: 'דני לוי',
          email: 'danny.levi@example.com',
          firstName: 'דני',
          lastName: 'לוי',
          rank: 'סגן',
          status: 'active'
        },
        {
          uid: 'mock-user-3',
          displayName: 'מיכל אברהם',
          email: 'michal.abraham@example.com',
          firstName: 'מיכל',
          lastName: 'אברהם',
          rank: 'רס״ן',
          status: 'active'
        }
      ].filter(user => 
        user.displayName.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
      
      if (mockUsers.length > 0) {
        console.log(`Returning ${mockUsers.length} mock users`);
        return mockUsers.slice(0, limitCount);
      }
    }

    // Sort results by relevance
    const sortedResults = results
      .sort((a, b) => {
        // Exact name matches first
        const aExactName = a.displayName.toLowerCase() === searchLower;
        const bExactName = b.displayName.toLowerCase() === searchLower;
        
        if (aExactName && !bExactName) return -1;
        if (!aExactName && bExactName) return 1;
        
        // Then by first name starts with
        const aFirstNameMatch = (a.firstName || '').toLowerCase().startsWith(searchLower);
        const bFirstNameMatch = (b.firstName || '').toLowerCase().startsWith(searchLower);
        
        if (aFirstNameMatch && !bFirstNameMatch) return -1;
        if (!aFirstNameMatch && bFirstNameMatch) return 1;
        
        // Finally alphabetical
        return a.displayName.localeCompare(b.displayName);
      })
      .slice(0, limitCount);

    return sortedResults;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * Get user profile by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
} 