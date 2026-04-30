/**
 * serverCreateEquipmentType — doc shape parity with serverProposeTemplate.
 *
 * Bug #14: the management-page canonical-create path was dropping `status`
 * and `requiresSerialNumber`, so the resulting doc never matched the
 * canonical-list filter (`status === CANONICAL`) and stayed invisible.
 * The created doc must now carry the same critical fields the propose
 * path writes.
 */

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'SERVER_TIMESTAMP',
  },
}));

jest.mock('firebase-admin/app', () => ({
  initializeApp: () => ({}),
  getApps: () => [],
  cert: () => ({}),
  applicationDefault: () => ({}),
}));

const writes: Record<string, unknown>[] = [];
const setMock = jest.fn(async (data: Record<string, unknown>) => {
  writes.push(data);
});
const docMock = jest.fn(() => ({ id: 'fake-template-id', set: setMock }));
const collectionMock = jest.fn(() => ({ doc: docMock }));

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: jest.fn(() => ({ collection: collectionMock })),
}));

import { serverCreateEquipmentType } from '../equipmentTemplatesService';
import { TemplateStatus } from '@/types/equipment';

describe('serverCreateEquipmentType — written doc shape', () => {
  beforeEach(() => {
    writes.length = 0;
  });

  it('writes status, requiresSerialNumber, and all critical fields', async () => {
    await serverCreateEquipmentType({
      name: 'Mgmt Template',
      category: 'cat-1',
      subcategory: 'sub-1',
      requiresSerialNumber: true,
      requiresDailyStatusCheck: false,
      isActive: true,
      templateCreatorId: 'admin-uid',
      status: TemplateStatus.CANONICAL,
    });

    expect(writes).toHaveLength(1);
    const doc = writes[0];
    expect(doc.status).toBe(TemplateStatus.CANONICAL);
    expect(doc.requiresSerialNumber).toBe(true);
    expect(doc.requiresDailyStatusCheck).toBe(false);
    expect(doc.isActive).toBe(true);
    expect(doc.templateCreatorId).toBe('admin-uid');
    expect(doc.name).toBe('Mgmt Template');
    expect(doc.category).toBe('cat-1');
    expect(doc.subcategory).toBe('sub-1');
    expect(doc.id).toBe('fake-template-id');
    expect(doc.createdAt).toBe('SERVER_TIMESTAMP');
    expect(doc.updatedAt).toBe('SERVER_TIMESTAMP');
  });

  it('persists optional fields only when present', async () => {
    await serverCreateEquipmentType({
      name: 'Bare',
      category: 'cat-1',
      subcategory: 'sub-1',
      requiresSerialNumber: false,
      requiresDailyStatusCheck: false,
      isActive: true,
      templateCreatorId: 'admin-uid',
      status: TemplateStatus.CANONICAL,
    });
    expect(writes[0].description).toBeUndefined();
    expect(writes[0].notes).toBeUndefined();
    expect(writes[0].defaultCatalogNumber).toBeUndefined();

    writes.length = 0;
    await serverCreateEquipmentType({
      name: 'With optionals',
      category: 'cat-1',
      subcategory: 'sub-1',
      requiresSerialNumber: false,
      requiresDailyStatusCheck: false,
      isActive: true,
      templateCreatorId: 'admin-uid',
      status: TemplateStatus.CANONICAL,
      description: 'desc',
      notes: 'note',
      defaultCatalogNumber: 'CAT-1',
    });
    expect(writes[0].description).toBe('desc');
    expect(writes[0].notes).toBe('note');
    expect(writes[0].defaultCatalogNumber).toBe('CAT-1');
  });
});
