import { AdminFirestoreService, SecurityUtils, ValidationUtils } from '../adminUtils';
import { getDocs, addDoc, writeBatch, doc } from 'firebase/firestore';

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  writeBatch: jest.fn(),
}));

describe('SecurityUtils', () => {
  let mockDigest: jest.SpyInstance;
  let mockGetRandomValues: jest.SpyInstance;

  beforeEach(() => {
    // Ensure crypto API is available
    if (typeof global.crypto === 'undefined') {
      (global as any).crypto = {
        subtle: {
          digest: jest.fn(),
        },
        getRandomValues: jest.fn(),
      };
    }
    mockDigest = jest.spyOn(global.crypto.subtle, 'digest');
    mockGetRandomValues = jest.spyOn(global.crypto, 'getRandomValues');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('hashMilitaryId', () => {
    it('should generate a hash and a salt', async () => {
      const militaryId = '1234567';
      const hash = 'somehash';

      mockGetRandomValues.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i;
        }
      });

      mockDigest.mockResolvedValue(new TextEncoder().encode(hash).buffer);

      const result = await SecurityUtils.hashMilitaryId(militaryId);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(typeof result.hash).toBe('string');
      expect(typeof result.salt).toBe('string');
    });

    it('should throw an error if hashing fails', async () => {
      const militaryId = '1234567';
      mockDigest.mockRejectedValue(new Error('Crypto failed'));

      await expect(SecurityUtils.hashMilitaryId(militaryId)).rejects.toThrow(
        'Failed to hash military ID: Crypto failed'
      );
    });
  });

  describe('verifyMilitaryId', () => {
    it('should return true for a valid military ID and hash', async () => {
      const militaryId = '1234567';
      const salt = 'somesalt';
      const correctHash = 'somehash';

      // Mock the hashMilitaryId function to return the correct hash
      jest.spyOn(SecurityUtils, 'hashMilitaryId').mockResolvedValue({
        hash: correctHash,
        salt,
      });

      const result = await SecurityUtils.verifyMilitaryId(
        militaryId,
        correctHash,
        salt
      );

      expect(result).toBe(true);
    });

    it('should return false for an invalid military ID', async () => {
      const incorrectMilitaryId = '7654321';
      const salt = 'somesalt';
      const correctHash = 'somehash';

      // Mock the hashMilitaryId function to return a different hash
      jest.spyOn(SecurityUtils, 'hashMilitaryId').mockResolvedValue({
        hash: 'differenthash',
        salt,
      });

      const result = await SecurityUtils.verifyMilitaryId(
        incorrectMilitaryId,
        correctHash,
        salt
      );
      expect(result).toBe(false);
    });

    it('should return false for an invalid hash', async () => {
      const militaryId = '1234567';
      const salt = 'somesalt';
      const incorrectHash = 'incorrecthash';
      const correctHash = 'somehash';

      // Mock the hashMilitaryId function to return the correct hash
      jest.spyOn(SecurityUtils, 'hashMilitaryId').mockResolvedValue({
        hash: correctHash,
        salt,
      });

      const result = await SecurityUtils.verifyMilitaryId(
        militaryId,
        incorrectHash,
        salt
      );
      expect(result).toBe(false);
    });

    it('should return false if hashing fails during verification', async () => {
      const militaryId = '1234567';
      const salt = 'somesalt';
      const hash = 'somehash';
      
      // Mock console.error to suppress expected error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      jest
        .spyOn(SecurityUtils, 'hashMilitaryId')
        .mockRejectedValue(new Error('Crypto failed'));

      const result = await SecurityUtils.verifyMilitaryId(militaryId, hash, salt);
      expect(result).toBe(false);
      
      // Verify that the error was logged (but suppressed from output)
      expect(consoleSpy).toHaveBeenCalledWith('Failed to verify military ID:', expect.any(Error));
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });
});

describe('AdminFirestoreService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkMilitaryIdExists', () => {
    it('should return true if a duplicate military ID is found', async () => {
      const militaryId = '1234567';
      const hash = 'somehash';
      const salt = 'somesalt';

      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{
          data: () => ({
            militaryPersonalNumberHash: hash,
            salt: salt,
          }),
        }],
      });

      const verifyMilitaryIdSpy = jest.spyOn(SecurityUtils, 'verifyMilitaryId').mockResolvedValue(true);

      const result = await AdminFirestoreService.checkMilitaryIdExists(militaryId);
      expect(result).toBe(true);

      verifyMilitaryIdSpy.mockRestore();
    });

    it('should return false if no duplicate military ID is found', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

      const result = await AdminFirestoreService.checkMilitaryIdExists('1234567');
      expect(result).toBe(false);
    });

    it('should throw an AdminError if a Firestore error occurs', async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      await expect(AdminFirestoreService.checkMilitaryIdExists('1234567')).rejects.toThrow(
        'Failed to check for duplicate military ID'
      );
    });
  });

  describe('addAuthorizedPersonnel', () => {
    it('should not add a new person if the military ID already exists', async () => {
      const formData = {
        militaryPersonalNumber: '1234567',
        firstName: 'John',
        lastName: 'Doe',
        rank: 'Captain',
        phoneNumber: '050-1234567',
      };

      const checkMilitaryIdExistsSpy = jest.spyOn(AdminFirestoreService, 'checkMilitaryIdExists').mockResolvedValue(true);
      jest.spyOn(ValidationUtils, 'validatePersonnelForm').mockReturnValue({
        isValid: true,
        errors: {},
      });

      const result = await AdminFirestoreService.addAuthorizedPersonnel(formData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Military Personal Number 1234567 already exists in the system');

      checkMilitaryIdExistsSpy.mockRestore();
    });

    it('should add a new person if the military ID does not exist', async () => {
      const formData = {
        militaryPersonalNumber: '1234567',
        firstName: 'John',
        lastName: 'Doe',
        rank: 'Captain',
        phoneNumber: '050-1234567',
      };

      const checkMilitaryIdExistsSpy = jest.spyOn(AdminFirestoreService, 'checkMilitaryIdExists').mockResolvedValue(false);
      const hashMilitaryIdSpy = jest.spyOn(SecurityUtils, 'hashMilitaryId').mockResolvedValue({
        hash: 'somehash',
        salt: 'somesalt',
      });
      (addDoc as jest.Mock).mockResolvedValue({ id: 'some-id' });

      const result = await AdminFirestoreService.addAuthorizedPersonnel(formData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('✅ Successfully added John Doe to authorized personnel list');

      checkMilitaryIdExistsSpy.mockRestore();
      hashMilitaryIdSpy.mockRestore();
    });
  });

  describe('addAuthorizedPersonnelBulk', () => {
    it('should correctly categorize successful, failed, and duplicate entries', async () => {
      const personnel = [
        { militaryPersonalNumber: '1', firstName: 'A', lastName: 'B', rank: 'C', phoneNumber: '050-1234567' },
        { militaryPersonalNumber: '2', firstName: 'D', lastName: 'E', rank: 'F', phoneNumber: '050-1234568' },
        { militaryPersonalNumber: '3', firstName: 'G', lastName: 'H', rank: 'I', phoneNumber: '050-1234569' },
        { militaryPersonalNumber: '1', firstName: 'J', lastName: 'K', rank: 'L', phoneNumber: '050-1234560' },
      ];

      // Mock checkMilitaryIdExists to return true for duplicates
      const checkMilitaryIdExistsSpy = jest.spyOn(AdminFirestoreService, 'checkMilitaryIdExists')
        .mockImplementation(async (militaryId) => {
          // Return true for '1' (duplicate) and false for others
          return militaryId === '1';
        });

      // Mock ValidationUtils.validateAuthorizedPersonnelData
      const validateSpy = jest.spyOn(ValidationUtils, 'validateAuthorizedPersonnelData')
        .mockImplementation((data) => {
          // Return invalid for militaryPersonalNumber '3' to simulate validation failure
          if (data.militaryPersonalNumber === '3') {
            return { isValid: false, errors: { militaryPersonalNumber: 'Invalid ID' } };
          }
          return { isValid: true, errors: {} as Record<string, string> };
        });

      // Mock SecurityUtils.hashMilitaryId for successful entries
      const hashSpy = jest.spyOn(SecurityUtils, 'hashMilitaryId').mockResolvedValue({
        hash: 'somehash',
        salt: 'somesalt',
      });

      // Mock ValidationUtils.toInternationalFormat
      const formatSpy = jest.spyOn(ValidationUtils, 'toInternationalFormat')
        .mockReturnValue('+972501234567');

      // Mock Firebase batch operations
      const mockCommit = jest.fn().mockResolvedValue(undefined);
      const mockSet = jest.fn();
      const mockBatch = { set: mockSet, commit: mockCommit };
      (writeBatch as jest.Mock).mockReturnValue(mockBatch);
      (doc as jest.Mock).mockReturnValue({ id: 'mock-doc-id' });

      const results = await AdminFirestoreService.addAuthorizedPersonnelBulk(personnel);

      // Expected results:
      // - 1 successful: militaryPersonalNumber '2' (valid and not duplicate)
      // - 2 duplicates: both entries with militaryPersonalNumber '1' (duplicate detected)
      // - 1 failed: militaryPersonalNumber '3' (validation failed)
      expect(results.successful.length).toBe(1);
      expect(results.duplicates.length).toBe(2);
      expect(results.failed.length).toBe(1);

      checkMilitaryIdExistsSpy.mockRestore();
      validateSpy.mockRestore();
      hashSpy.mockRestore();
      formatSpy.mockRestore();
    });
  });
});
