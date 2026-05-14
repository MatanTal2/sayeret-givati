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
  Timestamp: {
    fromMillis: (ms: number) => ({ toMillis: () => ms }),
  },
}));

const mockDeleteUser = jest.fn(async (uid: string) => { void uid; });
const mockAuditWrite = jest.fn(async (args: unknown) => {
  void args;
  return 'audit-id';
});

jest.mock('../credentialAuditService', () => ({
  writeCredentialAuditEvent: (args: unknown) => mockAuditWrite(args),
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
  getAdminAuth: () => ({
    deleteUser: (uid: string) => mockDeleteUser(uid),
  }),
}));

import {
  serverRequestAccountDeletion,
  serverCancelAccountDeletion,
  serverSweepAccountDeletions,
  countOutstandingAssetsForUser,
  AccountDeletionHasAssetsError,
  AccountDeletionAlreadyRequestedError,
  AccountDeletionNoPendingError,
} from '../accountDeletionService';

function resetWorld() {
  for (const k of Object.keys(collectionStore)) delete collectionStore[k];
  for (const k of Object.keys(collectionSizes)) delete collectionSizes[k];
  writes.length = 0;
  mockDeleteUser.mockReset();
  mockDeleteUser.mockImplementation(async () => undefined);
  mockAuditWrite.mockReset();
  mockAuditWrite.mockImplementation(async (args: unknown) => {
    void args;
    return 'audit-id';
  });
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

  describe('serverSweepAccountDeletions (onlyUid path)', () => {
    // Past the 30-day retention window. The service compares against
    // `opts.now`, so we can drive the cutoff deterministically.
    const NOW = new Date('2026-06-15T00:00:00Z');
    const PAST_REQUESTED_MS = NOW.getTime() - 40 * 24 * 60 * 60 * 1000;
    const FRESH_REQUESTED_MS = NOW.getTime() - 5 * 24 * 60 * 60 * 1000;
    const tsPast = { toMillis: () => PAST_REQUESTED_MS };
    const tsFresh = { toMillis: () => FRESH_REQUESTED_MS };

    function writesForUid(uid: string) {
      return writes.filter((w) => w.collection === 'users' && w.id === uid);
    }

    it('skips no_pending when the user has no deletionRequestedAt', async () => {
      seedUser('u1', { firstName: 'A' });
      const result = await serverSweepAccountDeletions({
        dryRun: false,
        batchLimit: 1,
        now: NOW,
        onlyUid: 'u1',
      });
      expect(result.deleted).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.candidates[0]).toMatchObject({ uid: 'u1', outcome: 'skipped', reason: 'no_pending' });
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('skips too_young when the request is inside the retention window', async () => {
      seedUser('u1', { deletionRequestedAt: tsFresh });
      const result = await serverSweepAccountDeletions({
        dryRun: false,
        batchLimit: 1,
        now: NOW,
        onlyUid: 'u1',
      });
      expect(result.skipped).toBe(1);
      expect(result.candidates[0].reason).toBe('too_young');
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('skips already_tombstoned when deletedAt is set', async () => {
      seedUser('u1', { deletionRequestedAt: tsPast, deletedAt: tsPast });
      const result = await serverSweepAccountDeletions({
        dryRun: false,
        batchLimit: 1,
        now: NOW,
        onlyUid: 'u1',
      });
      expect(result.skipped).toBe(1);
      expect(result.candidates[0].reason).toBe('already_tombstoned');
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('skips has_outstanding_assets when re-check finds equipment', async () => {
      seedUser('u1', { deletionRequestedAt: tsPast });
      seedQuerySize('equipment', 'currentHolderId==u1|status!=retired', 1);
      const result = await serverSweepAccountDeletions({
        dryRun: false,
        batchLimit: 1,
        now: NOW,
        onlyUid: 'u1',
      });
      expect(result.skipped).toBe(1);
      expect(result.candidates[0].reason).toBe('has_outstanding_assets');
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('dry-run counts a clean candidate as deleted without writes', async () => {
      seedUser('u1', { deletionRequestedAt: tsPast });
      const result = await serverSweepAccountDeletions({
        dryRun: true,
        batchLimit: 1,
        now: NOW,
        onlyUid: 'u1',
      });
      expect(result.deleted).toBe(1);
      expect(result.dryRun).toBe(true);
      expect(writesForUid('u1')).toHaveLength(0);
      expect(mockDeleteUser).not.toHaveBeenCalled();
      expect(mockAuditWrite).not.toHaveBeenCalled();
    });

    it('deletes clean candidate: stamps deletionStartedAt, calls Auth, tombstones, writes audit', async () => {
      seedUser('u1', { deletionRequestedAt: tsPast });
      const result = await serverSweepAccountDeletions({
        dryRun: false,
        batchLimit: 1,
        now: NOW,
        onlyUid: 'u1',
      });
      expect(result.deleted).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockDeleteUser).toHaveBeenCalledWith('u1');
      const u1Writes = writesForUid('u1');
      // First write stamps deletionStartedAt; second write is the tombstone.
      expect(u1Writes[0].payload).toMatchObject({ deletionStartedAt: 'SERVER_TIMESTAMP' });
      expect(u1Writes[1].payload).toMatchObject({
        deletedAt: 'SERVER_TIMESTAMP',
        displayName: 'Deleted User',
        email: null,
        phoneNumber: null,
        firstName: 'DELETE_SENTINEL',
        lastName: 'DELETE_SENTINEL',
      });
      expect(mockAuditWrite).toHaveBeenCalledWith(
        expect.objectContaining({ uid: 'u1', eventType: 'ACCOUNT_DELETED', actorUid: 'system' }),
      );
    });

    it('swallows auth/user-not-found and proceeds to tombstone (resume path)', async () => {
      seedUser('u1', { deletionRequestedAt: tsPast, deletionStartedAt: 'STAMP_FROM_PRIOR_RUN' });
      mockDeleteUser.mockImplementationOnce(async () => {
        const err = new Error('user not found') as Error & { code?: string };
        err.code = 'auth/user-not-found';
        throw err;
      });
      const result = await serverSweepAccountDeletions({
        dryRun: false,
        batchLimit: 1,
        now: NOW,
        onlyUid: 'u1',
      });
      expect(result.deleted).toBe(1);
      expect(result.errors).toHaveLength(0);
      const u1Writes = writesForUid('u1');
      expect(u1Writes.some((w) => w.payload?.deletedAt === 'SERVER_TIMESTAMP')).toBe(true);
    });

    it('records an auth_delete_failed error on non-recoverable Auth errors', async () => {
      seedUser('u1', { deletionRequestedAt: tsPast });
      mockDeleteUser.mockImplementationOnce(async () => {
        throw new Error('internal');
      });
      const result = await serverSweepAccountDeletions({
        dryRun: false,
        batchLimit: 1,
        now: NOW,
        onlyUid: 'u1',
      });
      expect(result.deleted).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ uid: 'u1', reason: 'auth_delete_failed' });
      // Tombstone must NOT have been written.
      const u1Writes = writesForUid('u1');
      expect(u1Writes.some((w) => w.payload?.deletedAt === 'SERVER_TIMESTAMP')).toBe(false);
    });

    it('non-fatal audit-write failure still counts the uid as deleted', async () => {
      seedUser('u1', { deletionRequestedAt: tsPast });
      mockAuditWrite.mockImplementationOnce(async () => {
        throw new Error('audit unavailable');
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await serverSweepAccountDeletions({
        dryRun: false,
        batchLimit: 1,
        now: NOW,
        onlyUid: 'u1',
      });
      expect(result.deleted).toBe(1);
      expect(result.errors).toHaveLength(0);
      consoleSpy.mockRestore();
    });
  });
});
