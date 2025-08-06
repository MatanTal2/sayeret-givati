/**
 * @jest-environment node
 */

import { ItemTypesService, MOCK_ITEM_TYPES } from '../itemTypesService';
import { ItemType } from '@/types/equipment';

// Mock Firebase modules
jest.mock('../firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDocs: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __timestamp: true }))
}));

// Get references to mocked functions
import { setDoc, getDocs } from 'firebase/firestore';

describe('ItemTypesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MOCK_ITEM_TYPES', () => {
    test('should contain the expected mock data structure', () => {
      expect(MOCK_ITEM_TYPES).toHaveLength(3);
      
      // Verify the first item (radio)
      const radioItem = MOCK_ITEM_TYPES.find(item => item.category === 'radio');
      expect(radioItem).toEqual({
        id: "TEMPLATE_RADIO_PRC-152",
        category: "radio",
        model: "PRC-152",
        manufacturer: "Harris",
        assignmentType: "team",
        defaultDepot: "Radio Depot",
        defaultImageUrl: "",
        defaultStatus: "work"
      });

      // Verify the optics item
      const opticsItem = MOCK_ITEM_TYPES.find(item => item.category === 'optics');
      expect(opticsItem).toEqual({
        id: "TEMPLATE_OPTICS_ACOG",
        category: "optics",
        model: "ACOG 4x32",
        manufacturer: "Trijicon",
        assignmentType: "personal",
        defaultDepot: "Optics Depot",
        defaultImageUrl: "",
        defaultStatus: "work"
      });

      // Verify the extraction gear item
      const extractionItem = MOCK_ITEM_TYPES.find(item => item.category === 'extraction_gear');
      expect(extractionItem).toEqual({
        id: "TEMPLATE_EXTRACTION_ROPE_30M",
        category: "extraction_gear",
        model: "Rescue Rope 30m",
        manufacturer: "Petzl",
        assignmentType: "team",
        defaultDepot: "Gear Depot",
        defaultImageUrl: "",
        defaultStatus: "work"
      });
    });

    test('should have all required fields for each item', () => {
      const requiredFields = [
        'id', 'category', 'model', 'manufacturer', 
        'assignmentType', 'defaultDepot', 'defaultStatus'
      ];

      MOCK_ITEM_TYPES.forEach(item => {
        requiredFields.forEach(field => {
          expect(item).toHaveProperty(field);
          expect(item[field as keyof ItemType]).toBeDefined();
        });
      });
    });

    test('should have valid assignmentType values', () => {
      const validAssignmentTypes = ['team', 'personal'];
      
      MOCK_ITEM_TYPES.forEach(item => {
        expect(validAssignmentTypes).toContain(item.assignmentType);
      });
    });

    test('should have unique IDs', () => {
      const ids = MOCK_ITEM_TYPES.map(item => item.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(MOCK_ITEM_TYPES.length);
    });
  });

  describe('addItemType', () => {
    test('should validate required fields', async () => {
      const invalidItem = {
        id: '',
        category: 'test',
        model: '',
        manufacturer: 'Test Corp',
        assignmentType: 'personal' as const,
        defaultDepot: 'Test Depot',
        defaultStatus: 'work'
      };

      const result = await ItemTypesService.addItemType(invalidItem);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required fields');
      expect(result.error).toBe('VALIDATION_ERROR');
    });

    test('should accept valid item type', async () => {
      const validItem: ItemType = {
        id: 'TEST_ITEM_1',
        category: 'weapons',
        model: 'M4A1',
        manufacturer: 'Colt',
        assignmentType: 'personal',
        defaultDepot: 'Armory',
        defaultStatus: 'work'
      };

      // Mock successful Firestore operation
      setDoc.mockResolvedValue(undefined);

      const result = await ItemTypesService.addItemType(validItem);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully added item type');
      expect(result.itemTypeId).toBe(validItem.id);
    });
  });

  describe('isCollectionEmpty', () => {
    test('should return true when collection is empty', async () => {
      // Mock empty collection
      getDocs.mockResolvedValue({
        docs: []
      });

      const isEmpty = await ItemTypesService.isCollectionEmpty();
      
      expect(isEmpty).toBe(true);
    });

    test('should return false when collection has items', async () => {
      // Mock collection with items
      getDocs.mockResolvedValue({
        docs: [{ id: 'item1', data: () => ({}) }]
      });

      const isEmpty = await ItemTypesService.isCollectionEmpty();
      
      expect(isEmpty).toBe(false);
    });

    test('should return true on error', async () => {
      // Mock error
      getDocs.mockRejectedValue(new Error('Network error'));

      const isEmpty = await ItemTypesService.isCollectionEmpty();
      
      expect(isEmpty).toBe(true);
    });
  });

  describe('seedItemTypes', () => {
    test('should skip seeding if collection already has data', async () => {
      // Mock non-empty collection
      getDocs.mockResolvedValue({
        docs: [{ id: 'existing1', data: () => MOCK_ITEM_TYPES[0] }]
      });

      const result = await ItemTypesService.seedItemTypes();
      
      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });
  });
});