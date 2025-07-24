import { AdminFirestoreService, SecurityUtils, ValidationUtils } from '../adminUtils';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';

// Mock Web Crypto API
const mockDigest = jest.fn();
const mockGetRandomValues = jest.fn();

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
    getRandomValues: mockGetRandomValues,
  },
});

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
}));

describe('SecurityUtils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hashMilitaryId', () => {
    it('should generate a hash and a salt', async () => {
      const militaryId = '1234567';
      const salt = 'somesalt';
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
      const militaryId = '1234567';
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
      jest
        .spyOn(SecurityUtils, 'hashMilitaryId')
        .mockRejectedValue(new Error('Crypto failed'));

      const result = await SecurityUtils.verifyMilitaryId(militaryId, hash, salt);
      expect(result).toBe(false);
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
      const militaryId = '1234567';

      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

      const result = await AdminFirestoreService.checkMilitaryIdExists(militaryId);
      expect(result).toBe(false);
    });

    it('should throw an AdminError if a Firestore error occurs', async () => {
      const militaryId = '1234567';
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      await expect(AdminFirestoreService.checkMilitaryIdExists(militaryId)).rejects.toThrow(
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
      const validatePersonnelFormSpy = jest.spyOn(ValidationUtils, 'validatePersonnelForm').mockReturnValue({
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

      const addAuthorizedPersonnelSpy = jest.spyOn(AdminFirestoreService, 'addAuthorizedPersonnel')
        .mockImplementation(async (person) => {
          if (person.militaryPersonalNumber === '1') {
            return { success: false, message: '', error: { code: 'DUPLICATE_ID' } };
          }
          if (person.militaryPersonalNumber === '2') {
            return { success: true, message: '' };
          }
          return { success: false, message: '' };
        });

      const results = await AdminFirestoreService.addAuthorizedPersonnelBulk(personnel);

      expect(results.successful.length).toBe(1);
      expect(results.duplicates.length).toBe(2);
      expect(results.failed.length).toBe(1);

      addAuthorizedPersonnelSpy.mockRestore();
    });
  });
});
