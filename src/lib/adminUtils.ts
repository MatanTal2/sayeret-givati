import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, query, getDocs, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import {
  AdminConfig,
  HashResult,
  PersonnelFormData,
  ValidationResult,
  AuthorizedPersonnel,
  PersonnelOperationResult
} from '@/types/admin';
import {
  ADMIN_CONFIG,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES,
  ADMIN_MESSAGES,
  SECURITY_CONFIG
} from '@/constants/admin';

/**
 * Security utilities for hashing military personal numbers
 */
export class SecurityUtils {
  /**
   * Generate a secure hash of military personal number using Web Crypto API
   */
  static async hashMilitaryId(militaryId: string, salt?: string): Promise<HashResult> {
    try {
      if (!salt) {
        // Generate random salt
        const saltArray = new Uint8Array(SECURITY_CONFIG.SALT_LENGTH);
        crypto.getRandomValues(saltArray);
        salt = Array.from(saltArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }

      // Create hash using Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(militaryId + salt);
      const hashBuffer = await crypto.subtle.digest(SECURITY_CONFIG.HASH_ALGORITHM, data);
      const hashArray = new Uint8Array(hashBuffer);
      const hash = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return { hash, salt };
    } catch (error) {
      throw new AdminError(`Failed to hash military ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a military personal number against a stored hash
   */
  static async verifyMilitaryId(militaryId: string, storedHash: string, salt: string): Promise<boolean> {
    try {
      const { hash } = await this.hashMilitaryId(militaryId, salt);
      return hash === storedHash;
    } catch (error) {
      console.error('Failed to verify military ID:', error);
      return false;
    }
  }
}

/**
 * Validation utilities for form data
 */
export class ValidationUtils {
  /**
   * Validate military personal number
   */
  static validateMilitaryId(value: string): string | null {
    if (!value.trim()) {
      return VALIDATION_MESSAGES.MILITARY_ID_REQUIRED;
    }
    if (!VALIDATION_PATTERNS.MILITARY_ID.test(value)) {
      return VALIDATION_MESSAGES.MILITARY_ID_INVALID;
    }
    return null;
  }

  /**
   * Validate first name
   */
  static validateFirstName(value: string): string | null {
    if (!value.trim()) {
      return VALIDATION_MESSAGES.FIRST_NAME_REQUIRED;
    }
    return null;
  }

  /**
   * Validate last name
   */
  static validateLastName(value: string): string | null {
    if (!value.trim()) {
      return VALIDATION_MESSAGES.LAST_NAME_REQUIRED;
    }
    return null;
  }

  /**
   * Validate military rank
   */
  static validateRank(value: string): string | null {
    if (!value.trim()) {
      return VALIDATION_MESSAGES.RANK_REQUIRED;
    }
    return null;
  }

  /**
   * Validate Israeli mobile phone number
   */
  static validatePhoneNumber(value: string): string | null {
    if (!value.trim()) {
      return VALIDATION_MESSAGES.PHONE_REQUIRED;
    }

    // Use improved Israeli mobile validation
    if (!this.isValidIsraeliMobile(value)) {
      return VALIDATION_MESSAGES.PHONE_INVALID;
    }

    return null;
  }

  /**
   * Check if phone number is a valid Israeli mobile number
   */
  static isValidIsraeliMobile(phone: string): boolean {
    // Remove spaces/hyphens
    const cleaned = phone.replace(/[\s-]/g, '');
    // Accept both +972 and 0 prefix for mobile numbers starting with 5
    return /^(?:\+972|0)5\d{8}$/.test(cleaned);
  }

  /**
   * Convert phone number to international format
   */
  static toInternationalFormat(phone: string): string {
    let cleaned = phone.replace(/[\s-]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '+972' + cleaned.slice(1);
    }
    return cleaned;
  }

  /**
   * Validate entire personnel form
   */
  static validatePersonnelForm(formData: PersonnelFormData): ValidationResult {
    const errors: Record<string, string> = {};

    const militaryIdError = this.validateMilitaryId(formData.militaryPersonalNumber);
    if (militaryIdError) errors.militaryPersonalNumber = militaryIdError;

    const firstNameError = this.validateFirstName(formData.firstName);
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = this.validateLastName(formData.lastName);
    if (lastNameError) errors.lastName = lastNameError;

    const rankError = this.validateRank(formData.rank);
    if (rankError) errors.rank = rankError;

    const phoneError = this.validatePhoneNumber(formData.phoneNumber);
    if (phoneError) errors.phoneNumber = phoneError;

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

/**
 * Firestore operations for admin functionality
 */
export class AdminFirestoreService {
  /**
   * Get admin configuration from Firestore
   */
  static async checkMilitaryIdExists(militaryId: string): Promise<boolean> {
    try {
      const personnelQuery = query(collection(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION));
      const querySnapshot = await getDocs(personnelQuery);

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (await SecurityUtils.verifyMilitaryId(militaryId, data.militaryPersonalNumberHash, data.salt)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      throw new AdminError('Failed to check for duplicate military ID', 'FIRESTORE_ERROR');
    }
  }

  static async getAdminConfig(): Promise<AdminConfig> {
    try {
      const adminDocRef = doc(db, ADMIN_CONFIG.FIRESTORE_ADMIN_COLLECTION, ADMIN_CONFIG.FIRESTORE_ADMIN_DOC);
      const adminDoc = await getDoc(adminDocRef);

      if (!adminDoc.exists()) {
        throw new AdminError(ADMIN_MESSAGES.LOGIN_CONFIG_NOT_FOUND, 'CONFIG_NOT_FOUND');
      }

      return adminDoc.data() as AdminConfig;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError(ADMIN_MESSAGES.LOGIN_CONNECTION_ERROR, 'FIRESTORE_ERROR');
    }
  }

  /**
   * Add authorized personnel to Firestore
   */
  static async addAuthorizedPersonnel(formData: PersonnelFormData): Promise<PersonnelOperationResult> {
    try {
      // Validate form data
      const validation = ValidationUtils.validatePersonnelForm(formData);
      if (!validation.isValid) {
        return {
          success: false,
          message: Object.values(validation.errors)[0], // Return first error
          error: new AdminError('Validation failed', 'VALIDATION_ERROR')
        };
      }

      // Check for duplicates
      const militaryIdExists = await this.checkMilitaryIdExists(formData.militaryPersonalNumber);
      if (militaryIdExists) {
        return {
          success: false,
          message: `Military Personal Number ${formData.militaryPersonalNumber} already exists in the system`,
          error: new AdminError('Duplicate military ID', 'DUPLICATE_ID')
        };
      }

      // Hash the military personal number
      const { hash, salt } = await SecurityUtils.hashMilitaryId(formData.militaryPersonalNumber);

      // Normalize phone number to international format
      const normalizedPhone = ValidationUtils.toInternationalFormat(formData.phoneNumber);

      // Create the authorized personnel document
      const personnelDoc = {
        militaryPersonalNumberHash: hash,
        salt: salt,
        phoneNumber: normalizedPhone,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        rank: formData.rank.trim(),
        createdAt: serverTimestamp(),
        createdBy: 'system_admin' // TODO: Replace with actual admin user ID
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION), personnelDoc);

      const addedPersonnel: AuthorizedPersonnel = {
        id: docRef.id,
        militaryPersonalNumberHash: hash,
        salt: salt,
        phoneNumber: normalizedPhone,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        rank: formData.rank.trim(),
        createdAt: serverTimestamp() as unknown as Timestamp, // Firestore will replace with actual timestamp
        createdBy: 'system_admin'
      };

      return {
        success: true,
        personnel: addedPersonnel,
        message: ADMIN_MESSAGES.PERSONNEL_ADD_SUCCESS(`${formData.firstName} ${formData.lastName}`)
      };

    } catch (error) {
      console.error('Error adding authorized personnel:', error);
      return {
        success: false,
        message: ADMIN_MESSAGES.PERSONNEL_ADD_FAILED,
        error: error instanceof AdminError ? error : new AdminError('Unknown error occurred', 'UNKNOWN_ERROR')
      };
    }
  }

  /**
   * Get all authorized personnel from Firestore
   */
  static async getAllAuthorizedPersonnel(): Promise<AuthorizedPersonnel[]> {
    try {
      const personnelQuery = query(collection(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION));
      const querySnapshot = await getDocs(personnelQuery);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuthorizedPersonnel));

    } catch (error) {
      console.error('Error fetching authorized personnel:', error);
      throw new AdminError('Failed to fetch authorized personnel', 'FETCH_ERROR');
    }
  }

  /**
   * Delete authorized personnel by ID
   */
  static async deleteAuthorizedPersonnel(id: string): Promise<PersonnelOperationResult> {
    try {
      const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION, id);
      await deleteDoc(docRef);

      return {
        success: true,
        message: ADMIN_MESSAGES.PERSONNEL_DELETE_SUCCESS('personnel')
      };

    } catch (error) {
      console.error('Error deleting authorized personnel:', error);
      return {
        success: false,
        message: ADMIN_MESSAGES.PERSONNEL_DELETE_FAILED,
        error: error instanceof AdminError ? error : new AdminError('Failed to delete personnel', 'DELETE_ERROR')
      };
    }
  }

  static async addAuthorizedPersonnelBulk(personnel: PersonnelFormData[]): Promise<any> {
    const results = {
      successful: [],
      failed: [],
      duplicates: [],
    };

    for (const person of personnel) {
      const result = await this.addAuthorizedPersonnel(person);
      if (result.success) {
        results.successful.push(person);
      } else if (result.error?.code === 'DUPLICATE_ID') {
        results.duplicates.push(person);
      } else {
        results.failed.push(person);
      }
    }

    return results;
  }
}

/**
 * Session management utilities
 */
export class SessionUtils {
  /**
   * Check if admin session is valid
   */
  static isSessionValid(): boolean {
    try {
      const sessionData = localStorage.getItem(ADMIN_CONFIG.SESSION_STORAGE_KEY);
      if (!sessionData) return false;

      const session = JSON.parse(sessionData);
      const now = new Date().getTime();

      return session.expires > now;
    } catch {
      return false;
    }
  }

  /**
   * Create admin session
   */
  static createSession(email: string): void {
    const session = {
      email,
      loginTime: new Date().getTime(),
      expires: new Date().getTime() + ADMIN_CONFIG.SESSION_DURATION
    };
    localStorage.setItem(ADMIN_CONFIG.SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  /**
   * Clear admin session
   */
  static clearSession(): void {
    localStorage.removeItem(ADMIN_CONFIG.SESSION_STORAGE_KEY);
  }

  /**
   * Get current session
   */
  static getCurrentSession(): { email: string; loginTime: number; expires: number } | null {
    try {
      const sessionData = localStorage.getItem(ADMIN_CONFIG.SESSION_STORAGE_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }
}

/**
 * Admin error class for better error handling
 */
export class AdminError extends Error {
  public code?: string;
  public operation?: string;
  public timestamp: Date;

  constructor(message: string, code?: string, operation?: string) {
    super(message);
    this.name = 'AdminError';
    this.code = code;
    this.operation = operation;
    this.timestamp = new Date();
  }
}
