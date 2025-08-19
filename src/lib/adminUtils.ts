import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, getDocs, deleteDoc, updateDoc, serverTimestamp, Timestamp, writeBatch, DocumentReference, setDoc, where } from 'firebase/firestore';
import {
  AdminConfig,
  PersonnelFormData,
  ValidationResult,
  AuthorizedPersonnel,
  AuthorizedPersonnelData,
  PersonnelOperationResult
} from '@/types/admin';
import { UserType } from '@/types/user';
import {
  ADMIN_CONFIG,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES,
  ADMIN_MESSAGES,
  SECURITY_CONFIG
} from '@/constants/admin';
import { validateUserName } from '@/lib/equipmentValidation';

/**
 * Security utilities for hashing military personal numbers
 */
export class SecurityUtils {
  /**
   * Generate a secure hash of military personal number using Web Crypto API
   */
  static async hashMilitaryId(militaryId: string): Promise<string> {
    try {
      // Create hash using Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(militaryId);
      const hashBuffer = await crypto.subtle.digest(SECURITY_CONFIG.HASH_ALGORITHM, data);
      const hashArray = new Uint8Array(hashBuffer);
      const hash = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return hash;
    } catch (error) {
      throw new AdminError(`Failed to hash military ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a military personal number against a stored hash
   */
  static async verifyMilitaryId(militaryId: string, storedHash: string): Promise<boolean> {
    try {
      const hash = await this.hashMilitaryId(militaryId);
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
    if (!value || !value.trim()) {
      return VALIDATION_MESSAGES.FIRST_NAME_REQUIRED;
    }
    
    // Use existing validation from equipmentValidation.ts
    const nameValidation = validateUserName(value);
    if (!nameValidation.isValid) {
      return nameValidation.error || 'Invalid first name';
    }
    
    return null;
  }

  /**
   * Validate last name  
   */
  static validateLastName(value: string): string | null {
    if (!value || !value.trim()) {
      return VALIDATION_MESSAGES.LAST_NAME_REQUIRED;
    }
    
    // Use existing validation from equipmentValidation.ts
    const nameValidation = validateUserName(value);
    if (!nameValidation.isValid) {
      return nameValidation.error || 'Invalid last name';
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
   * Validate phone number
   */
  static validatePhoneNumber(value: string): string | null {
    if (!value || !value.trim()) {
      return VALIDATION_MESSAGES.PHONE_REQUIRED;
    }

    // Use improved Israeli mobile validation
    if (!this.isValidIsraeliMobile(value)) {
      return VALIDATION_MESSAGES.PHONE_INVALID;
    }

    return null;
  }

  /**
   * Validate Israeli mobile phone number
   */
  static isValidIsraeliMobile(phone: string): boolean {
    const cleaned = phone.replace(/[\s-]/g, '');
    return VALIDATION_PATTERNS.PHONE_NUMBER.test(cleaned);
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
   * Validate email address
   */
  static validateEmail(value: string): string | null {
    if (!value || !value.trim()) {
      return VALIDATION_MESSAGES.EMAIL_REQUIRED;
    }
    
    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value.trim())) {
      return VALIDATION_MESSAGES.EMAIL_INVALID;
    }
    
    return null;
  }

  /**
   * Validate entire personnel form (for full registration with email)
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

    const emailError = this.validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Unified validation for authorized personnel data (both single add and bulk operations)
   */
  static validateAuthorizedPersonnelData(data: AuthorizedPersonnelData): ValidationResult {
    const errors: Record<string, string> = {};

    const militaryIdError = this.validateMilitaryId(data.militaryPersonalNumber);
    if (militaryIdError) errors.militaryPersonalNumber = militaryIdError;

    const firstNameError = this.validateFirstName(data.firstName);
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = this.validateLastName(data.lastName);
    if (lastNameError) errors.lastName = lastNameError;

    const rankError = this.validateRank(data.rank);
    if (rankError) errors.rank = rankError;

    const phoneError = this.validatePhoneNumber(data.phoneNumber);
    if (phoneError) errors.phoneNumber = phoneError;

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate personnel form for bulk upload (no email required)
   * @deprecated Use validateAuthorizedPersonnelData instead
   */
  static validatePersonnelFormBulkUpload(formData: Partial<PersonnelFormData>): ValidationResult {
    // Convert to AuthorizedPersonnelData format and validate
    const data: AuthorizedPersonnelData = {
      militaryPersonalNumber: formData.militaryPersonalNumber || '',
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      rank: formData.rank || '',
      phoneNumber: formData.phoneNumber || ''
    };
    
    return this.validateAuthorizedPersonnelData(data);
  }
}

/**
 * Firestore operations for admin functionality
 */
export class AdminFirestoreService {
  /**
   * Check if military personal number already exists (by checking hashed version)
   * Uses O(1) document lookup with hash ID as document ID
   */
  static async checkMilitaryIdExists(militaryId: string): Promise<boolean> {
    try {
      // Generate hash to use as document ID
      const hash = await SecurityUtils.hashMilitaryId(militaryId);
      
      // Direct document lookup with O(1) complexity
      const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION, hash);
      const docSnapshot = await getDoc(docRef);

      return docSnapshot.exists();
    } catch {
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
    } catch {
      throw new AdminError(ADMIN_MESSAGES.LOGIN_CONNECTION_ERROR, 'FIRESTORE_ERROR');
    }
  }

  /**
   * Add authorized personnel to Firestore with duplicate checking using transactions
   */
  static async addAuthorizedPersonnel(formData: AuthorizedPersonnelData): Promise<PersonnelOperationResult> {
    try {
      // Validate form data using unified validation
      const validation = ValidationUtils.validateAuthorizedPersonnelData(formData);
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
      const hash = await SecurityUtils.hashMilitaryId(formData.militaryPersonalNumber);

      // Normalize phone number to international format
      const normalizedPhone = ValidationUtils.toInternationalFormat(formData.phoneNumber);

      // Create the authorized personnel document
      const personnelDoc = {
        militaryPersonalNumberHash: hash,
        phoneNumber: normalizedPhone,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        rank: formData.rank.trim(),
        userType: formData.userType || UserType.USER, // Include userType with default fallback
        registered: false, // Default to false until user completes registration
        approvedRole: 'soldier', // Default role
        roleStatus: 'approved' as const, // Default approved status
        status: 'active' as const, // Default active status
        joinDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: 'system_admin' // TODO: Replace with actual admin user ID
      };

      // Add to Firestore using hash as document ID for O(1) lookup
      const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION, hash);
      await setDoc(docRef, personnelDoc);

      const addedPersonnel: AuthorizedPersonnel = {
        id: docRef.id,
        militaryPersonalNumberHash: hash,
        phoneNumber: normalizedPhone,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        rank: formData.rank.trim(),
        userType: formData.userType || UserType.USER, // Include userType with default fallback
        registered: false, // Default to false until user completes registration
        approvedRole: 'soldier', // Default role for all new users
        roleStatus: 'approved', // Auto-approve basic soldier role
        status: 'active', // Default status
        joinDate: serverTimestamp() as unknown as Timestamp,
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
      
      if (error instanceof AdminError && error.code === 'DUPLICATE_MILITARY_ID') {
        return {
          success: false,
          message: error.message,
          error
        };
      }
      
      return {
        success: false,
        message: ADMIN_MESSAGES.PERSONNEL_ADD_FAILED,
        error: error instanceof AdminError ? error : new AdminError('Unknown error occurred', 'UNKNOWN_ERROR')
      };
    }
  }

  /**
   * Update authorized personnel information
   */
  static async updateAuthorizedPersonnel(
    personnelId: string, 
    updateData: {
      firstName?: string;
      lastName?: string;
      rank?: string;
      phoneNumber?: string;
      userType?: string;
    }
  ): Promise<PersonnelOperationResult> {
    try {
      // Validate the update data (only fields that are provided)
      const validationErrors: Record<string, string> = {};

      if (updateData.firstName !== undefined) {
        const firstNameError = ValidationUtils.validateFirstName(updateData.firstName);
        if (firstNameError) validationErrors.firstName = firstNameError;
      }

      if (updateData.lastName !== undefined) {
        const lastNameError = ValidationUtils.validateLastName(updateData.lastName);
        if (lastNameError) validationErrors.lastName = lastNameError;
      }

      if (updateData.rank !== undefined) {
        const rankError = ValidationUtils.validateRank(updateData.rank);
        if (rankError) validationErrors.rank = rankError;
      }

      if (updateData.phoneNumber !== undefined) {
        const phoneError = ValidationUtils.validatePhoneNumber(updateData.phoneNumber);
        if (phoneError) validationErrors.phoneNumber = phoneError;
      }

      if (updateData.userType !== undefined) {
        // Validate userType (basic validation)
        const validUserTypes = ['user', 'admin', 'officer', 'commander'];
        if (!validUserTypes.includes(updateData.userType)) {
          validationErrors.userType = 'Invalid user type';
        }
      }

      // If there are validation errors, return them
      if (Object.keys(validationErrors).length > 0) {
        return {
          success: false,
          message: Object.values(validationErrors)[0], // Return first error
          error: new AdminError('Validation failed', 'VALIDATION_ERROR')
        };
      }

      // Check if personnel exists
      const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION, personnelId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Personnel not found',
          error: new AdminError('Personnel not found', 'NOT_FOUND')
        };
      }

      // If phone number is being updated, check for duplicates (excluding current personnel)
      if (updateData.phoneNumber !== undefined) {
        const allPersonnel = await this.getAllAuthorizedPersonnel();
        const phoneExists = allPersonnel.some(p => 
          p.id !== personnelId && p.phoneNumber === updateData.phoneNumber
        );

        if (phoneExists) {
          return {
            success: false,
            message: 'Phone number already exists for another personnel',
            error: new AdminError('Phone number duplicate', 'DUPLICATE_PHONE')
          };
        }
      }

      // Prepare update data with timestamp
      const updateFields = {
        ...updateData,
        updatedAt: Timestamp.now(),
        updatedBy: 'admin' // TODO: Get actual admin user ID when auth is implemented
      };

      // Update the document
      await updateDoc(docRef, updateFields);

      // Get updated personnel data for sync and success message
      const currentPersonnel = docSnap.data() as AuthorizedPersonnel;
      const updatedPersonnel = { ...currentPersonnel, ...updateData };
      
      // If user is registered, sync changes to users collection
      if (currentPersonnel.registered && (updateData.firstName || updateData.lastName || updateData.rank || updateData.phoneNumber || updateData.userType)) {
        await this.syncAuthorizedPersonnelToUser(personnelId, updateData);
      }

      const fullName = `${updateData.firstName || currentPersonnel.firstName} ${updateData.lastName || currentPersonnel.lastName}`;

      return {
        success: true,
        message: `✅ Successfully updated ${fullName}`,
        personnel: {
          ...updatedPersonnel,
          id: personnelId
        } as AuthorizedPersonnel
      };

    } catch (error) {
      console.error('Error updating authorized personnel:', error);
      return {
        success: false,
        message: 'Failed to update personnel. Please try again.',
        error: error instanceof AdminError ? error : new AdminError('Unknown error occurred', 'UNKNOWN_ERROR')
      };
    }
  }

  /**
   * Sync authorized personnel changes to users collection
   * Only updates if user is registered (has completed Firebase Auth registration)
   */
  private static async syncAuthorizedPersonnelToUser(
    militaryIdHash: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      rank?: string;
      phoneNumber?: string;
      userType?: string;
    }
  ): Promise<void> {
    try {
      // Find the user in users collection by militaryPersonalNumberHash
      const usersCollection = collection(db, ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION);
      const userQuery = query(usersCollection, where('militaryPersonalNumberHash', '==', militaryIdHash));
      
      const userSnapshot = await getDocs(userQuery);
      
      // Get the first matching user document
      let userDocId: string | null = null;
      if (!userSnapshot.empty) {
        userDocId = userSnapshot.docs[0].id;
      }

      if (!userDocId) {
        console.warn(`⚠️ No user found in users collection for militaryIdHash: ${militaryIdHash}`);
        return;
      }

      // Prepare user update data (only fields that exist in users collection)
      const userUpdateData = {
        updatedAt: Timestamp.now()
      };
      
      if (updateData.firstName) Object.assign(userUpdateData, { firstName: updateData.firstName });
      if (updateData.lastName) Object.assign(userUpdateData, { lastName: updateData.lastName });
      if (updateData.rank) Object.assign(userUpdateData, { rank: updateData.rank });
      if (updateData.phoneNumber) Object.assign(userUpdateData, { phoneNumber: updateData.phoneNumber });
      if (updateData.userType) Object.assign(userUpdateData, { userType: updateData.userType });

      // Update user document
      const userDocRef = doc(db, ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION, userDocId);
      await updateDoc(userDocRef, userUpdateData);
      
      console.log(`✅ Successfully synced changes to user: ${userDocId}`);

    } catch (error) {
      console.error('⚠️ Failed to sync changes to users collection (non-critical):', error);
      // Don't throw error - sync failure shouldn't break the main update operation
    }
  }

  /**
   * Bulk add authorized personnel using Firebase batched writes
   */
  static async addAuthorizedPersonnelBulk(
    personnelList: AuthorizedPersonnelData[]
  ): Promise<{
    successful: { person: AuthorizedPersonnelData; id: string }[];
    failed: { person: AuthorizedPersonnelData; error: string; rowIndex: number }[];
    duplicates: { person: AuthorizedPersonnelData; rowIndex: number }[];
  }> {
    const successful: { person: AuthorizedPersonnelData; id: string }[] = [];
    const failed: { person: AuthorizedPersonnelData; error: string; rowIndex: number }[] = [];
    const duplicates: { person: AuthorizedPersonnelData; rowIndex: number }[] = [];

    // First, check for duplicates and validate all entries
    for (let i = 0; i < personnelList.length; i++) {
      const person = personnelList[i];
      
      try {
        // Validate the person data
        const validation = ValidationUtils.validateAuthorizedPersonnelData(person);
        if (!validation.isValid) {
          failed.push({
            person,
            error: Object.values(validation.errors)[0],
            rowIndex: i + 2 // +2 because CSV row numbering starts from 2
          });
          continue;
        }

        // Check for duplicates
        const isDuplicate = await this.checkMilitaryIdExists(person.militaryPersonalNumber);
        if (isDuplicate) {
          duplicates.push({
            person,
            rowIndex: i + 2
          });
          continue;
        }

      } catch (error) {
        failed.push({
          person,
          error: error instanceof Error ? error.message : 'Unknown validation error',
          rowIndex: i + 2
        });
      }
    }

    // Filter out failed and duplicate entries for batch processing
    const validPersonnel = personnelList.filter((_, index) => {
      const rowIndex = index + 2;
      return !failed.some(f => f.rowIndex === rowIndex) && 
             !duplicates.some(d => d.rowIndex === rowIndex);
    });

    // Process valid entries in batches (Firestore limit is 500 operations per batch)
    const BATCH_SIZE = 100; // Use smaller batch size for safety
    
    for (let i = 0; i < validPersonnel.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchPersonnel = validPersonnel.slice(i, i + BATCH_SIZE);
      const batchDocs: { person: AuthorizedPersonnelData; docRef: DocumentReference; hash: string }[] = [];

      try {
        // Prepare all batch operations
        for (const person of batchPersonnel) {
          // Hash the military personal number
          const hash = await SecurityUtils.hashMilitaryId(person.militaryPersonalNumber);
          
          // Normalize phone number to international format
          const normalizedPhone = ValidationUtils.toInternationalFormat(person.phoneNumber);
          
          // Create the authorized personnel document
          const personnelDoc = {
            militaryPersonalNumberHash: hash,
            phoneNumber: normalizedPhone,
            firstName: person.firstName.trim(),
            lastName: person.lastName.trim(),
            rank: person.rank.trim(),
            userType: person.userType || 'user', // Include userType with default fallback
            registered: false, // Default to false until user completes registration
            approvedRole: 'soldier', // Default role for all new users
            roleStatus: 'approved', // Auto-approve basic soldier role
            status: 'active', // Default status
            joinDate: serverTimestamp(),
            createdAt: serverTimestamp(),
            createdBy: 'system_admin' // TODO: Replace with actual admin user ID
          };

          const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION, hash);
          batch.set(docRef, personnelDoc);
          
          batchDocs.push({ person, docRef, hash });
        }

        // Commit the batch
        await batch.commit();
        
        // Add successful entries
        batchDocs.forEach(({ person, docRef }) => {
          successful.push({
            person,
            id: docRef.id
          });
        });

      } catch (error) {
        // If batch fails, mark all in this batch as failed
        batchPersonnel.forEach((person) => {
          const originalIndex = personnelList.findIndex(p => p === person);
          failed.push({
            person,
            error: `Batch operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            rowIndex: originalIndex + 2
          });
        });
      }
    }

    return { successful, failed, duplicates };
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

  /**
   * Get registration status of authorized personnel
   */
  static async getRegistrationStatus(militaryIdHash: string): Promise<boolean | null> {
    try {
      const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION, militaryIdHash);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.registered ?? false; // Default to false if field doesn't exist
      }
      
      return null; // Personnel not found
    } catch (error) {
      console.error('❌ Error checking registration status:', error);
      throw new AdminError('Failed to check registration status', 'FIRESTORE_ERROR');
    }
  }

  /**
   * Get all personnel with their registration status for admin dashboard
   */
  static async getAllPersonnelWithRegistrationStatus(): Promise<(AuthorizedPersonnel & { registered: boolean })[]> {
    try {
      const personnelCollection = collection(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION);
      const snapshot = await getDocs(personnelCollection);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registered: doc.data().registered ?? false // Ensure backward compatibility
      } as AuthorizedPersonnel & { registered: boolean }));
    } catch (error) {
      console.error('❌ Error fetching personnel with registration status:', error);
      throw new AdminError('Failed to fetch personnel data', 'FIRESTORE_ERROR');
    }
  }

  /**
   * Update registration status manually (for admin use)
   */
  static async updateRegistrationStatus(militaryIdHash: string, registered: boolean): Promise<PersonnelOperationResult> {
    try {
      const docRef = doc(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION, militaryIdHash);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          message: 'Personnel not found',
          error: new AdminError('Personnel not found', 'NOT_FOUND')
        };
      }

      await updateDoc(docRef, {
        registered,
        updatedAt: serverTimestamp()
      });

      const updatedData = docSnap.data() as AuthorizedPersonnel;
      
      return {
        success: true,
        personnel: { ...updatedData, registered },
        message: `Registration status updated to ${registered ? 'registered' : 'unregistered'}`
      };
    } catch (error) {
      console.error('❌ Error updating registration status:', error);
      return {
        success: false,
        message: 'Failed to update registration status',
        error: error instanceof Error ? error : new AdminError('Unknown error', 'UNKNOWN_ERROR')
      };
    }
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


