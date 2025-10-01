import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';
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