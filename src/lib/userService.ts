import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';
import { SecurityUtils } from '@/lib/adminUtils';
import { UserRole } from '@/types/equipment';

// Constants
const USERS_COLLECTION = 'users';

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
}

/**
 * Interface for user profile document in Firestore
 */
export interface UserProfile {
  uid: string; // Hash of military ID (matches document ID)
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthday: Timestamp;
  phoneNumber: string;
  rank: string; // From authorized_personnel
  role: UserRole;
  status: 'active' | 'inactive' | 'transferred' | 'discharged';
  militaryPersonalNumberHash: string; // Link to authorized_personnel
  permissions: string[];
  joinDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profileImage?: string;
  testUser?: boolean;
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
   * Create a new user account with Firebase Auth and Firestore profile
   */
  static async registerUser(registrationData: RegistrationData): Promise<UserRegistrationResult> {
    try {
      console.log('🚀 Starting user registration process');

      // 1. Generate hash ID for military personal number
      const militaryIdHash = await SecurityUtils.hashMilitaryId(registrationData.militaryPersonalNumber);
      console.log('🔨 Generated military ID hash for user document ID');

      // 2. Get authorized personnel data
      const authorizedPersonnel = await this.getAuthorizedPersonnelData(militaryIdHash);
      if (!authorizedPersonnel) {
        return {
          success: false,
          error: 'Military ID not found in authorized personnel. Registration not allowed.'
        };
      }

      // 3. Create Firebase Auth user
      console.log('🔐 Creating Firebase Auth user');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registrationData.email,
        registrationData.password
      );
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase Auth user created:', firebaseUser.uid);

      // 4. Create user profile document in Firestore
      const userProfile: UserProfile = {
        uid: militaryIdHash, // Use military ID hash as document ID
        email: registrationData.email,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        gender: registrationData.gender,
        birthday: Timestamp.fromDate(new Date(registrationData.birthdate)),
        phoneNumber: registrationData.phoneNumber,
        rank: authorizedPersonnel.rank || '', // From authorized_personnel
        role: UserRole.SOLDIER, // Default role
        status: 'active', // Default status
        militaryPersonalNumberHash: militaryIdHash,
        permissions: ['equipment:view'], // Default soldier permissions
        joinDate: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      // 5. Save user profile to Firestore using hash as document ID
      const userDocRef = doc(db, USERS_COLLECTION, militaryIdHash);
      await setDoc(userDocRef, userProfile);
      console.log('✅ User profile created in Firestore with ID:', militaryIdHash);

      return {
        success: true,
        uid: militaryIdHash,
        message: 'User registration completed successfully'
      };

    } catch (error) {
      console.error('❌ Error during user registration:', error);
      
      // Handle specific Firebase Auth errors
      if (error instanceof Error) {
        if (error.message.includes('email-already-in-use')) {
          return {
            success: false,
            error: 'Email address is already registered. Please use a different email or try logging in.'
          };
        }
        if (error.message.includes('weak-password')) {
          return {
            success: false,
            error: 'Password is too weak. Please choose a stronger password.'
          };
        }
        if (error.message.includes('invalid-email')) {
          return {
            success: false,
            error: 'Invalid email address format.'
          };
        }
      }

      return {
        success: false,
        error: 'Registration failed. Please try again or contact support.'
      };
    }
  }

  /**
   * Get authorized personnel data by military ID hash
   */
  private static async getAuthorizedPersonnelData(militaryIdHash: string): Promise<{ rank: string } | null> {
    try {
      const personnelDocRef = doc(db, 'authorized_personnel', militaryIdHash);
      const personnelDoc = await getDoc(personnelDocRef);
      
      if (personnelDoc.exists()) {
        const data = personnelDoc.data();
        return {
          rank: data.rank || ''
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
      const userDocRef = doc(db, USERS_COLLECTION, militaryIdHash);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }
} 