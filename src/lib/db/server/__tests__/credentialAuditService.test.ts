/**
 * Tests for the credential audit service. Verifies that writes shape the
 * Firestore document correctly (server timestamp, conditional fields,
 * metadata gating) and that list scopes by uid + orderBy + limit.
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

const addMock = jest.fn(async (data: Record<string, unknown>) => {
  capturedWrites.push(data);
  return { id: 'fake-audit-id' };
});

interface QueryState {
  wheres: Array<[string, string, unknown]>;
  orders: Array<[string, string]>;
  limitN: number | null;
}

const capturedWrites: Record<string, unknown>[] = [];
let queryState: QueryState = { wheres: [], orders: [], limitN: null };
const docs = [
  { id: 'a1', data: () => ({ uid: 'u1', eventType: 'PASSWORD_CHANGED' }) },
  { id: 'a2', data: () => ({ uid: 'u1', eventType: 'PHONE_CHANGED' }) },
];

const queryChain = () => ({
  where: (field: string, op: string, value: unknown) => {
    queryState.wheres.push([field, op, value]);
    return queryChain();
  },
  orderBy: (field: string, direction: string) => {
    queryState.orders.push([field, direction]);
    return queryChain();
  },
  limit: (n: number) => {
    queryState.limitN = n;
    return queryChain();
  },
  get: async () => ({ docs }),
});

const collectionMock = jest.fn(() => ({
  add: addMock,
  ...queryChain(),
}));

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: jest.fn(() => ({ collection: collectionMock })),
}));

import { writeCredentialAuditEvent, listCredentialAuditForUser } from '../credentialAuditService';

describe('credentialAuditService', () => {
  beforeEach(() => {
    capturedWrites.length = 0;
    queryState = { wheres: [], orders: [], limitN: null };
    addMock.mockClear();
    collectionMock.mockClear();
  });

  describe('writeCredentialAuditEvent', () => {
    it('writes minimal entry with server timestamp', async () => {
      const id = await writeCredentialAuditEvent({
        uid: 'u1',
        actorUid: 'u1',
        actorUserType: 'user',
        eventType: 'PASSWORD_CHANGED',
      });
      expect(id).toBe('fake-audit-id');
      expect(capturedWrites[0]).toMatchObject({
        uid: 'u1',
        actorUid: 'u1',
        actorUserType: 'user',
        eventType: 'PASSWORD_CHANGED',
        timestamp: 'SERVER_TIMESTAMP',
      });
      expect(capturedWrites[0]).not.toHaveProperty('ip');
      expect(capturedWrites[0]).not.toHaveProperty('userAgent');
      expect(capturedWrites[0]).not.toHaveProperty('metadata');
    });

    it('includes ip + userAgent when supplied', async () => {
      await writeCredentialAuditEvent({
        uid: 'u1',
        actorUid: 'u1',
        actorUserType: 'user',
        eventType: 'PASSWORD_CHANGED',
        ip: '1.2.3.4',
        userAgent: 'TestAgent/1.0',
      });
      expect(capturedWrites[0]).toMatchObject({ ip: '1.2.3.4', userAgent: 'TestAgent/1.0' });
    });

    it('omits metadata key when object is empty', async () => {
      await writeCredentialAuditEvent({
        uid: 'u1',
        actorUid: 'u1',
        actorUserType: 'user',
        eventType: 'PASSWORD_CHANGED',
        metadata: {},
      });
      expect(capturedWrites[0]).not.toHaveProperty('metadata');
    });

    it('includes metadata when non-empty', async () => {
      await writeCredentialAuditEvent({
        uid: 'u1',
        actorUid: 'admin-1',
        actorUserType: 'admin',
        eventType: 'PHONE_FORCE_RESET',
        metadata: { reason: 'lost_device' },
      });
      expect(capturedWrites[0]).toMatchObject({ metadata: { reason: 'lost_device' } });
    });
  });

  describe('listCredentialAuditForUser', () => {
    it('scopes by uid, orders newest first, applies default limit', async () => {
      const entries = await listCredentialAuditForUser('u1');
      expect(queryState.wheres).toContainEqual(['uid', '==', 'u1']);
      expect(queryState.orders).toContainEqual(['timestamp', 'desc']);
      expect(queryState.limitN).toBe(50);
      expect(entries).toHaveLength(2);
      expect(entries[0]).toMatchObject({ id: 'a1', uid: 'u1' });
    });

    it('respects a caller-supplied limit', async () => {
      await listCredentialAuditForUser('u1', 10);
      expect(queryState.limitN).toBe(10);
    });
  });
});
