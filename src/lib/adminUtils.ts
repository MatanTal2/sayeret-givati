import { db } from '@/lib/firebase';
import { 
  doc, 
  collection, 
  query, 
  getDocs, 
  deleteDoc, 
  serverTimestamp, 
  Timestamp,
  runTransaction,
  writeBatch,
  DocumentReference
} from 'firebase/firestore';
import { validatePhoneNumber, validateUserName } from '@/lib/equipmentValidation';
import { 
  HashResult, 
  PersonnelFormData, 
  AuthorizedPersonnelData,
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
  static async hashMilitaryId(militaryId: string): Promise<HashResult> {
    try {
      // Generate random salt
      const saltArray = new Uint8Array(SECURITY_CONFIG.SALT_LENGTH);
      crypto.getRandomValues(saltArray);
      const salt = Array.from(saltArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
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
      // Create hash using the same method but with the stored salt
      const encoder = new TextEncoder();
      const data = encoder.encode(militaryId + salt);
      const hashBuffer = await crypto.subtle.digest(SECURITY_CONFIG.HASH_ALGORITHM, data);
      const hashArray = new Uint8Array(hashBuffer);
      const computedHash = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      return computedHash === storedHash;
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
    
    // Use existing validation from equipmentValidation.ts
    const phoneValidation = validatePhoneNumber(value);
    if (!phoneValidation.isValid) {
      return phoneValidation.error || VALIDATION_MESSAGES.PHONE_INVALID;
    }
    
    return null;
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
   */
  static async checkMilitaryIdExists(militaryId: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking for duplicate military ID: ${militaryId}`);
      
      // Get all authorized personnel records
      const personnelRef = collection(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION);
      const snapshot = await getDocs(personnelRef);
      
      console.log(`📋 Found ${snapshot.docs.length} existing personnel records to check`);
      
      // Check each record by verifying the military ID against stored hash+salt
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.militaryPersonalNumberHash && data.salt) {
          console.log(`🔒 Checking against record ${doc.id}`);
          const isMatch = await SecurityUtils.verifyMilitaryId(
            militaryId, 
            data.militaryPersonalNumberHash, 
            data.salt
          );
          if (isMatch) {
            console.log(`❌ DUPLICATE FOUND! Military ID ${militaryId} matches record ${doc.id}`);
            return true; // Found duplicate
          }
        }
      }
      
      console.log(`✅ No duplicate found for military ID: ${militaryId}`);
      return false; // No duplicate found
    } catch (error) {
      console.error('❌ Error checking military ID:', error);
      throw new AdminError('Failed to check for duplicate military ID', 'DUPLICATE_CHECK_ERROR');
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

      // Check for duplicate military ID BEFORE the transaction
      const isDuplicate = await this.checkMilitaryIdExists(formData.militaryPersonalNumber);
      if (isDuplicate) {
        return {
          success: false,
          message: `Military Personal Number ${formData.militaryPersonalNumber} already exists in the system`,
          error: new AdminError(
            `Military Personal Number ${formData.militaryPersonalNumber} already exists in the system`,
            'DUPLICATE_MILITARY_ID'
          )
        };
      }

      // Use transaction to add the personnel (no more duplicate check inside)
      const result = await runTransaction(db, async (transaction) => {
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
          approvedRole: 'soldier', // Default role for all new users
          roleStatus: 'approved', // Auto-approve basic soldier role
          status: 'active', // Default status
          joinDate: serverTimestamp(),
          createdAt: serverTimestamp(),
          createdBy: 'system_admin' // TODO: Replace with actual admin user ID
        };

        // Add to Firestore using transaction
        const docRef = doc(collection(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION));
        transaction.set(docRef, personnelDoc);
        
        return {
          docId: docRef.id,
          hash,
          salt,
          normalizedPhone
        };
      });

      const addedPersonnel: AuthorizedPersonnel = {
        id: result.docId,
        militaryPersonalNumberHash: result.hash,
        salt: result.salt,
        phoneNumber: result.normalizedPhone,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        rank: formData.rank.trim(),
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
      const batchDocs: { person: AuthorizedPersonnelData; docRef: DocumentReference; hash: string; salt: string }[] = [];

      try {
        // Prepare all batch operations
        for (const person of batchPersonnel) {
          // Hash the military personal number
          const { hash, salt } = await SecurityUtils.hashMilitaryId(person.militaryPersonalNumber);
          
          // Normalize phone number to international format
          const normalizedPhone = ValidationUtils.toInternationalFormat(person.phoneNumber);
          
          // Create the authorized personnel document
          const personnelDoc = {
            militaryPersonalNumberHash: hash,
            salt: salt,
            phoneNumber: normalizedPhone,
            firstName: person.firstName.trim(),
            lastName: person.lastName.trim(),
            rank: person.rank.trim(),
            approvedRole: 'soldier', // Default role for all new users
            roleStatus: 'approved', // Auto-approve basic soldier role
            status: 'active', // Default status
            joinDate: serverTimestamp(),
            createdAt: serverTimestamp(),
            createdBy: 'system_admin' // TODO: Replace with actual admin user ID
          };

          const docRef = doc(collection(db, ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION));
          batch.set(docRef, personnelDoc);
          
          batchDocs.push({ person, docRef, hash, salt });
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