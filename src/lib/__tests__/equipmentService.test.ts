/**
 * @jest-environment node
 */

import { EquipmentService, SAMPLE_EQUIPMENT_DATA } from '../equipmentService';

// Mock Firebase modules
jest.mock('../firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __timestamp: true }))
}));

// Get references to mocked functions
import { setDoc, getDocs } from 'firebase/firestore';

// Mock ItemTypesService
jest.mock('../itemTypesService', () => ({
  ItemTypesService: {
    getAllItemTypes: jest.fn(() => Promise.resolve([
      {
        id: "TEMPLATE_RADIO_PRC-152",
        category: "radio",
        model: "PRC-152",
        manufacturer: "Harris",
        assignmentType: "team",
        defaultDepot: "Radio Depot",
        defaultStatus: "work"
      },
      {
        id: "TEMPLATE_OPTICS_ACOG",
        category: "optics",
        model: "ACOG 4x32",
        manufacturer: "Trijicon",
        assignmentType: "personal",
        defaultDepot: "Optics Depot",
        defaultStatus: "work"
      }
    ]))
  }
}));

describe('EquipmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SAMPLE_EQUIPMENT_DATA', () => {
    test('should contain the expected sample data structure', () => {
      expect(SAMPLE_EQUIPMENT_DATA).toHaveLength(6);
      
      // Verify first radio item
      const radioItem = SAMPLE_EQUIPMENT_DATA.find(item => item.id === 'EQ-RADIO-001');
      expect(radioItem).toEqual({
        id: "EQ-RADIO-001",
        itemTypeId: "TEMPLATE_RADIO_PRC-152",
        assignedUserId: "user-001",
        assignedUserName: "דני כהן",
        status: "active",
        imageUrl: "https://storage.googleapis.com/sayeret-givati/equipment/radio-prc152-001.jpg"
      });

      // Verify optics item
      const opticsItem = SAMPLE_EQUIPMENT_DATA.find(item => item.id === 'EQ-OPTICS-001');
      expect(opticsItem).toEqual({
        id: "EQ-OPTICS-001",
        itemTypeId: "TEMPLATE_OPTICS_ACOG",
        assignedUserId: "user-003",
        assignedUserName: "מיכאל אברהם",
        status: "active",
        imageUrl: "https://storage.googleapis.com/sayeret-givati/equipment/acog-001.jpg"
      });

      // Verify rope item with depot override
      const ropeItem = SAMPLE_EQUIPMENT_DATA.find(item => item.id === 'EQ-ROPE-002');
      expect(ropeItem).toEqual({
        id: "EQ-ROPE-002",
        itemTypeId: "TEMPLATE_EXTRACTION_ROPE_30M",
        assignedUserId: "team-bravo",
        assignedUserName: "כיתה בראבו",
        equipmentDepot: "Advanced Gear Depot",
        status: "maintenance",
        imageUrl: "https://storage.googleapis.com/sayeret-givati/equipment/rope-30m-002.jpg"
      });
    });

    test('should have all required fields for each sample item', () => {
      const requiredFields = ['id', 'itemTypeId', 'assignedUserId'];

      SAMPLE_EQUIPMENT_DATA.forEach(item => {
        requiredFields.forEach(field => {
          expect(item).toHaveProperty(field);
          expect(item[field as keyof typeof item]).toBeDefined();
          expect(item[field as keyof typeof item]).not.toBe('');
        });
      });
    });

    test('should have unique IDs', () => {
      const ids = SAMPLE_EQUIPMENT_DATA.map(item => item.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(SAMPLE_EQUIPMENT_DATA.length);
    });

    test('should reference valid itemType templates', () => {
      const validTemplateIds = [
        'TEMPLATE_RADIO_PRC-152',
        'TEMPLATE_OPTICS_ACOG',
        'TEMPLATE_EXTRACTION_ROPE_30M'
      ];

      SAMPLE_EQUIPMENT_DATA.forEach(item => {
        expect(validTemplateIds).toContain(item.itemTypeId);
      });
    });
  });

  describe('createEquipment', () => {
    test('should validate required fields', async () => {
      const invalidData = {
        id: '',
        itemTypeId: 'TEMPLATE_RADIO_PRC-152',
        assignedUserId: '',
        status: 'active'
      };

      const result = await EquipmentService.createEquipment(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required fields');
      expect(result.error).toBe('VALIDATION_ERROR');
    });

    test('should fail when itemType template not found', async () => {
      const invalidData = {
        id: 'EQ-TEST-001',
        itemTypeId: 'NONEXISTENT_TEMPLATE',
        assignedUserId: 'test-user',
        status: 'active'
      };

      const result = await EquipmentService.createEquipment(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('ItemType template not found');
      expect(result.error).toBe('ITEM_TYPE_NOT_FOUND');
    });

    test('should create equipment with valid data', async () => {
      const validData = {
        id: 'EQ-TEST-001',
        itemTypeId: 'TEMPLATE_RADIO_PRC-152',
        assignedUserId: 'test-user',
        assignedUserName: 'Test User',
        status: 'active',
        imageUrl: 'https://example.com/image.jpg'
      };

      // Mock successful Firestore operation
      setDoc.mockResolvedValue(undefined);

      const result = await EquipmentService.createEquipment(validData);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully created equipment');
      expect(result.equipmentId).toBe(validData.id);
    });
  });

  describe('isCollectionEmpty', () => {
    test('should return true when collection is empty', async () => {
      // Mock empty collection
      getDocs.mockResolvedValue({
        docs: []
      });

      const isEmpty = await EquipmentService.isCollectionEmpty();
      
      expect(isEmpty).toBe(true);
    });

    test('should return false when collection has items', async () => {
      // Mock collection with items
      getDocs.mockResolvedValue({
        docs: [{ id: 'eq1', data: () => ({}) }]
      });

      const isEmpty = await EquipmentService.isCollectionEmpty();
      
      expect(isEmpty).toBe(false);
    });

    test('should return true on error', async () => {
      // Mock error
      getDocs.mockRejectedValue(new Error('Network error'));

      const isEmpty = await EquipmentService.isCollectionEmpty();
      
      expect(isEmpty).toBe(true);
    });
  });

  describe('seedEquipment', () => {
    test('should skip seeding if collection already has data', async () => {
      // Mock non-empty collection
      getDocs.mockResolvedValue({
        docs: [{ id: 'existing1', data: () => SAMPLE_EQUIPMENT_DATA[0] }]
      });

      const result = await EquipmentService.seedEquipment();
      
      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });
  });

  describe('updateEquipmentStatus', () => {
    test('should update equipment status successfully', async () => {
      setDoc.mockResolvedValue(undefined);

      const result = await EquipmentService.updateEquipmentStatus('EQ-001', 'maintenance');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Equipment status updated to: maintenance');
      expect(result.equipmentId).toBe('EQ-001');
    });
  });

  describe('transferEquipment', () => {
    test('should transfer equipment successfully', async () => {
      setDoc.mockResolvedValue(undefined);

      const result = await EquipmentService.transferEquipment('EQ-001', 'new-user', 'New User');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Equipment transferred to: New User');
      expect(result.equipmentId).toBe('EQ-001');
    });
  });
});