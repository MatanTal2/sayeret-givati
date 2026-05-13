/**
 * Tests for the account-deletion service. Covers pre-flight asset count,
 * soft-delete request happy path, blocked-by-assets, already-requested,
 * cancel, and idempotency.
 */

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'SERVER_TIMESTAMP',
    delete: () => 'DELETE_SENTINEL',
  },
}));

jest.mock('firebase-admin/app', () => ({
  initializeApp: () => ({}),
  getApps: () => [],
  cert: () => ({}),
  applicationDefault: () => ({}),
}));

interface DocState {
  exists: boolean;
  data?: Record<string, unknown>;
}

const collectionStore: Record<string, Record<string, DocState>> = {};
const collectionSizes: Record<string, Record<string, number>> = {};
const writes: Array<{ collection: string; id: string; op: 'update'; payload?: Record<string, unknown> }> = [];

function makeDocRef(collectionId: string, docId: string) {
  return {
    get: async () => {
      const state = collectionStore[collectionId]?.[docId] ?? { exists: false };
      return { exists: state.exists, data: () => state.data };
    },
    update: async (payload: Record<string, unknown>) => {
      writes.push({ collection: collectionId, id: docId, op: 'update', payload });
      collectionStore[collectionId] = collectionStore[collectionId] ?? {};
      const prev = collectionStore[collectionId][docId]?.data ?? {};
      collectionStore[collectionId][docId] = { exists: true, data: { ...prev, ...payload } };
    },
  };
}

function makeQuery(collectionId: string, signatureParts: string[]) {
  const signature = signatureParts.join('|');
  return {
    where(field: string, op: string, value: unknown) {
      return makeQuery(collectionId, [...signatureParts, `${field}${op}${value}`]);
    },
    async get() {
      const size = collectionSizes[collectionId]?.[signature] ?? 0;
      return { size };
    },
  };
}

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: () => ({
    collection: (id: string) => ({
      doc: (docId: string) => makeDocRef(id, docId),
      where(field: string, op: string, value: unknown) {
        return makeQuery(id, [`${field}${op}${value}`]);
      },
    }),
  }),
}));

import {
  serverRequestAccountDeletion,
  serverCancelAccountDeletion,
  countOutstandingAssetsForUser,
  AccountDeletionHasAssetsError,
  AccountDeletionAlreadyRequestedError,
  AccountDeletionNoPendingError,
} from '../accountDeletionService';

function resetWorld() {
  for (const k of Object.keys(collectionStore)) delete collectionStore[k];
  for (const k of Object.keys(collectionSizes)) delete collectionSizes[k];
  writes.length = 0;
}

function seedUser(uid: string, data: Record<string, unknown>) {
  collectionStore['users'] = collectionStore['users'] ?? {};
  collectionStore['users'][uid] = { exists: true, data };
}

function seedQuerySize(collection: string, signature: string, size: number) {
  collectionSizes[collection] = collectionSizes[collection] ?? {};
  collectionSizes[collection][signature] = size;
}

describe('accountDeletionService', () => {
  beforeEach(resetWorld);

  describe('countOutstandingAssetsForUser', () => {
    it('aggregates counts from equipment, ammunition serial, ammo inventory, and pending transfers', async () => {
      seedQuerySize('equipment', 'currentHolderId==u1|status!=retired', 3);
      seedQuerySize('ammunition', 'currentHolderType==USER|currentHolderId==u1', 2);
      seedQuerySize('ammunitionInventory', 'holderType==USER|holderId==u1', 1);
      seedQuerySize('transferRequests', 'fromUserId==u1|status==pending', 1);
      seedQuerySize('transferRequests', 'toUserId==u1|status==pending', 1);

      const result = await countOutstandingAssetsForUser('u1');
      expect(result).toEqual({
        equipmentCount: 3,
        ammunitionUserHoldings: 3,
        pendingTransferRequests: 2,
      });
    });

    it('returns zeros when nothing outstanding', async () => {
      const result = await countOutstandingAssetsForUser('u-clean');
      expect(result).toEqual({
        equipmentCount: 0,
        ammunitionUserHoldings: 0,
        pendingTransferRequests: 0,
      });
    });
  });

  describe('serverRequestAccountDeletion', () => {
    it('stamps deletionRequestedAt when user has no outstanding assets', async () => {
      seedUser('u1', { firstName: 'A' });
      const result = await serverRequestAccountDeletion({ uid: 'u1' });
      expect(result.deletionRequestedAtMs).toBeGreaterThan(0);
      const write = writes.find((w) => w.collection === 'users' && w.id === 'u1');
      expect(write?.payload).toMatchObject({
        deletionRequestedAt: 'SERVER_TIMESTAMP',
      });
    });

    it('persists optional reason when supplied', async () => {
      seedUser('u1', {});
      await serverRequestAccountDeletion({ uid: 'u1', reason: 'leaving unit' });
      const write = writes.find((w) => w.collection === 'users' && w.id === 'u1');
      expect(write?.payload).toMatchObject({ deletionReason: 'leaving unit' });
    });

    it('omits reason when empty / whitespace', async () => {
      seedUser('u1', {});
      await serverRequestAccountDeletion({ uid: 'u1', reason: '   ' });
      const write = writes.find((w) => w.collection === 'users' && w.id === 'u1');
      expect(write?.payload).not.toHaveProperty('deletionReason');
    });

    it('blocks when user is still holding equipment', async () => {
      seedUser('u1', {});
      seedQuerySize('equipment', 'currentHolderId==u1|status!=retired', 1);
      await expect(
        serverRequestAccountDeletion({ uid: 'u1' }),
      ).rejects.toBeInstanceOf(AccountDeletionHasAssetsError);
    });

    it('blocks when user has open transfer requests', async () => {
      seedUser('u1', {});
      seedQuerySize('transferRequests', 'fromUserId==u1|status==pending', 1);
      await expect(
        serverRequestAccountDeletion({ uid: 'u1' }),
      ).rejects.toBeInstanceOf(AccountDeletionHasAssetsError);
    });

    it('rejects when deletion already requested', async () => {
      seedUser('u1', { deletionRequestedAt: 'SOME_TS' });
      await expect(
        serverRequestAccountDeletion({ uid: 'u1' }),
      ).rejects.toBeInstanceOf(AccountDeletionAlreadyRequestedError);
    });
  });

  describe('serverCancelAccountDeletion', () => {
    it('clears deletionRequestedAt when a request is pending', async () => {
      seedUser('u1', { deletionRequestedAt: 'SOME_TS', deletionReason: 'r' });
      await serverCancelAccountDeletion('u1');
      const write = writes.find((w) => w.collection === 'users' && w.id === 'u1');
      expect(write?.payload).toMatchObject({
        deletionRequestedAt: 'DELETE_SENTINEL',
        deletionReason: 'DELETE_SENTINEL',
      });
    });

    it('throws when no pending request exists', async () => {
      seedUser('u1', {});
      await expect(serverCancelAccountDeletion('u1')).rejects.toBeInstanceOf(
        AccountDeletionNoPendingError,
      );
    });
  });
});
