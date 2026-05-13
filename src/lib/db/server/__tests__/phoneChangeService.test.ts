/**
 * Tests for the phone-change service. Covers initiate (rate limit,
 * same-number short-circuit, pending-doc write) and confirm (nonce,
 * target, proof-claim, freshness, idempotency, and mirror+reverse-sync).
 */

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
  Timestamp: {
    fromMillis: (ms: number) => ({ toMillis: () => ms }),
  },
}));

jest.mock('firebase-admin/app', () => ({
  initializeApp: () => ({}),
  getApps: () => [],
  cert: () => ({}),
  applicationDefault: () => ({}),
}));

jest.mock('@/lib/cryptoUtils', () => ({
  hashPhoneE164: (s: string) => `hash(${s})`,
  randomNonce: () => 'NONCE_FIXED',
}));

interface DocState {
  exists: boolean;
  data?: Record<string, unknown>;
}

const collectionStore: Record<string, Record<string, DocState>> = {};
const writes: Array<{ collection: string; id: string; op: 'set' | 'update' | 'delete'; payload?: Record<string, unknown> }> = [];

const reverseSyncMock = jest.fn(async (...args: [string, string]) => {
  void args;
  return true;
});

jest.mock('../authorizedPersonnelService', () => ({
  serverWritePhoneToPersonnel: (...args: [string, string]) => reverseSyncMock(...args),
}));

function makeDocRef(collectionId: string, docId: string) {
  return {
    get: async () => {
      const state = collectionStore[collectionId]?.[docId] ?? { exists: false };
      return {
        exists: state.exists,
        data: () => state.data,
      };
    },
    set: async (payload: Record<string, unknown>) => {
      writes.push({ collection: collectionId, id: docId, op: 'set', payload });
      collectionStore[collectionId] = collectionStore[collectionId] ?? {};
      collectionStore[collectionId][docId] = { exists: true, data: payload };
    },
    update: async (payload: Record<string, unknown>) => {
      writes.push({ collection: collectionId, id: docId, op: 'update', payload });
      collectionStore[collectionId] = collectionStore[collectionId] ?? {};
      const prev = collectionStore[collectionId][docId]?.data ?? {};
      collectionStore[collectionId][docId] = { exists: true, data: { ...prev, ...payload } };
    },
    delete: async () => {
      writes.push({ collection: collectionId, id: docId, op: 'delete' });
      if (collectionStore[collectionId]) delete collectionStore[collectionId][docId];
    },
  };
}

function makeBatch() {
  const ops: Array<{ ref: ReturnType<typeof makeDocRef>; op: 'update' | 'delete'; payload?: Record<string, unknown> }> = [];
  return {
    update: (ref: ReturnType<typeof makeDocRef>, payload: Record<string, unknown>) => {
      ops.push({ ref, op: 'update', payload });
    },
    delete: (ref: ReturnType<typeof makeDocRef>) => {
      ops.push({ ref, op: 'delete' });
    },
    commit: async () => {
      for (const op of ops) {
        if (op.op === 'update') await op.ref.update(op.payload!);
        else await op.ref.delete();
      }
    },
  };
}

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: () => ({
    collection: (id: string) => ({
      doc: (docId: string) => makeDocRef(id, docId),
    }),
    batch: () => makeBatch(),
  }),
}));

import {
  serverInitiatePhoneChange,
  serverConfirmPhoneChange,
  serverCancelPhoneChange,
  PhoneChangeRateLimitError,
  PhoneChangePhoneInUseError,
  PhoneChangeNoPendingError,
  PhoneChangeNonceMismatchError,
  PhoneChangeTargetMismatchError,
  PhoneChangeProofMissingError,
  PhoneChangeAuthTooOldError,
} from '../phoneChangeService';

function resetWorld() {
  for (const k of Object.keys(collectionStore)) delete collectionStore[k];
  writes.length = 0;
  reverseSyncMock.mockClear();
}

function seedUser(uid: string, data: Record<string, unknown>) {
  collectionStore['users'] = collectionStore['users'] ?? {};
  collectionStore['users'][uid] = { exists: true, data };
}
function seedPending(uid: string, data: Record<string, unknown>) {
  collectionStore['phoneChangePending'] = collectionStore['phoneChangePending'] ?? {};
  collectionStore['phoneChangePending'][uid] = { exists: true, data };
}

describe('phoneChangeService', () => {
  beforeEach(resetWorld);

  describe('serverInitiatePhoneChange', () => {
    it('writes a pending doc with the server-issued nonce', async () => {
      seedUser('u1', { phoneNumber: '+972500000001' });

      const result = await serverInitiatePhoneChange({
        uid: 'u1',
        actorUid: 'u1',
        newPhoneE164: '+972500000002',
      });

      expect(result.nonce).toBe('NONCE_FIXED');
      const pendingWrite = writes.find((w) => w.collection === 'phoneChangePending' && w.op === 'set');
      expect(pendingWrite?.payload).toMatchObject({
        uid: 'u1',
        actorUid: 'u1',
        newPhoneE164: '+972500000002',
        nonce: 'NONCE_FIXED',
      });
    });

    it('rejects when new phone equals current phone', async () => {
      seedUser('u1', { phoneNumber: '+972500000001' });
      await expect(
        serverInitiatePhoneChange({ uid: 'u1', actorUid: 'u1', newPhoneE164: '+972500000001' }),
      ).rejects.toBeInstanceOf(PhoneChangePhoneInUseError);
    });

    it('rejects when rate-limit window has not elapsed', async () => {
      seedUser('u1', { phoneNumber: '+972500000001' });
      collectionStore['phoneChangeRateLimit'] = {
        u1: {
          exists: true,
          data: { lastInitiateAt: { toMillis: () => Date.now() - 5_000 } },
        },
      };
      await expect(
        serverInitiatePhoneChange({ uid: 'u1', actorUid: 'u1', newPhoneE164: '+972500000002' }),
      ).rejects.toBeInstanceOf(PhoneChangeRateLimitError);
    });

    it('allows when rate-limit window has elapsed', async () => {
      seedUser('u1', { phoneNumber: '+972500000001' });
      collectionStore['phoneChangeRateLimit'] = {
        u1: {
          exists: true,
          data: { lastInitiateAt: { toMillis: () => Date.now() - 120_000 } },
        },
      };
      await expect(
        serverInitiatePhoneChange({ uid: 'u1', actorUid: 'u1', newPhoneE164: '+972500000002' }),
      ).resolves.toEqual({ nonce: 'NONCE_FIXED' });
    });
  });

  describe('serverConfirmPhoneChange', () => {
    function setupHappyPath() {
      const pendingCreatedAtMs = 1_000_000;
      seedUser('u1', {
        phoneNumber: '+972500000001',
        militaryPersonalNumberHash: 'hash-u1',
      });
      seedPending('u1', {
        uid: 'u1',
        newPhoneE164: '+972500000002',
        nonce: 'NONCE_FIXED',
        createdAt: { toMillis: () => pendingCreatedAtMs },
        actorUid: 'u1',
      });
      return { pendingCreatedAtMs };
    }

    it('mirrors phone, stamps sessionEpoch, deletes pending, reverse-syncs personnel', async () => {
      const { pendingCreatedAtMs } = setupHappyPath();
      const authTimeSeconds = (pendingCreatedAtMs + 60_000) / 1000;

      const result = await serverConfirmPhoneChange({
        uid: 'u1',
        newPhoneE164: '+972500000002',
        nonce: 'NONCE_FIXED',
        tokenPhoneNumber: '+972500000002',
        tokenAuthTimeSeconds: authTimeSeconds,
      });

      expect(result.oldPhoneE164).toBe('+972500000001');
      expect(result.newPhoneE164).toBe('+972500000002');
      expect(result.sessionEpochMs).toBe(authTimeSeconds * 1000);

      const userUpdate = writes.find((w) => w.collection === 'users' && w.op === 'update');
      expect(userUpdate?.payload).toMatchObject({
        phoneNumber: '+972500000002',
        sessionEpoch: authTimeSeconds * 1000,
      });

      const pendingDelete = writes.find((w) => w.collection === 'phoneChangePending' && w.op === 'delete');
      expect(pendingDelete).toBeTruthy();

      expect(reverseSyncMock).toHaveBeenCalledWith('hash-u1', '+972500000002');
    });

    it('rejects nonce mismatch', async () => {
      setupHappyPath();
      await expect(
        serverConfirmPhoneChange({
          uid: 'u1',
          newPhoneE164: '+972500000002',
          nonce: 'WRONG',
          tokenPhoneNumber: '+972500000002',
          tokenAuthTimeSeconds: Date.now() / 1000,
        }),
      ).rejects.toBeInstanceOf(PhoneChangeNonceMismatchError);
    });

    it('rejects target mismatch', async () => {
      setupHappyPath();
      await expect(
        serverConfirmPhoneChange({
          uid: 'u1',
          newPhoneE164: '+972500000003',
          nonce: 'NONCE_FIXED',
          tokenPhoneNumber: '+972500000003',
          tokenAuthTimeSeconds: Date.now() / 1000,
        }),
      ).rejects.toBeInstanceOf(PhoneChangeTargetMismatchError);
    });

    it('rejects when token phone_number claim does not match new phone', async () => {
      setupHappyPath();
      await expect(
        serverConfirmPhoneChange({
          uid: 'u1',
          newPhoneE164: '+972500000002',
          nonce: 'NONCE_FIXED',
          tokenPhoneNumber: '+972500000001',
          tokenAuthTimeSeconds: Date.now() / 1000,
        }),
      ).rejects.toBeInstanceOf(PhoneChangeProofMissingError);
    });

    it('rejects when auth_time predates pending createdAt', async () => {
      const { pendingCreatedAtMs } = setupHappyPath();
      const staleAuthTimeSeconds = (pendingCreatedAtMs - 1_000) / 1000;
      await expect(
        serverConfirmPhoneChange({
          uid: 'u1',
          newPhoneE164: '+972500000002',
          nonce: 'NONCE_FIXED',
          tokenPhoneNumber: '+972500000002',
          tokenAuthTimeSeconds: staleAuthTimeSeconds,
        }),
      ).rejects.toBeInstanceOf(PhoneChangeAuthTooOldError);
    });

    it('rejects when there is no pending doc', async () => {
      seedUser('u1', { phoneNumber: '+972500000001' });
      await expect(
        serverConfirmPhoneChange({
          uid: 'u1',
          newPhoneE164: '+972500000002',
          nonce: 'NONCE_FIXED',
          tokenPhoneNumber: '+972500000002',
          tokenAuthTimeSeconds: Date.now() / 1000,
        }),
      ).rejects.toBeInstanceOf(PhoneChangeNoPendingError);
    });

    it('is idempotent — already-applied retry returns success without re-writing', async () => {
      seedUser('u1', { phoneNumber: '+972500000002', sessionEpoch: 42 });
      // no pending doc — already consumed
      const result = await serverConfirmPhoneChange({
        uid: 'u1',
        newPhoneE164: '+972500000002',
        nonce: 'NONCE_FIXED',
        tokenPhoneNumber: '+972500000002',
        tokenAuthTimeSeconds: Date.now() / 1000,
      });
      expect(result.newPhoneE164).toBe('+972500000002');
      expect(result.sessionEpochMs).toBe(42);
      const userUpdates = writes.filter((w) => w.collection === 'users' && w.op === 'update');
      expect(userUpdates).toHaveLength(0);
    });
  });

  describe('serverCancelPhoneChange', () => {
    it('deletes the pending doc when one exists', async () => {
      seedPending('u1', { newPhoneE164: '+972500000002' });
      await serverCancelPhoneChange('u1');
      const del = writes.find((w) => w.collection === 'phoneChangePending' && w.op === 'delete');
      expect(del).toBeTruthy();
    });

    it('is a silent no-op when no pending exists', async () => {
      await expect(serverCancelPhoneChange('u1')).resolves.toBeUndefined();
    });
  });
});
