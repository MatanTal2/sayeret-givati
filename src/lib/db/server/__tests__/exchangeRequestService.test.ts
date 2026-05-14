/**
 * Tests for the exchange-request server service. Verifies the transactional
 * shape of all four flows (request / approve / reject / replace-by-another)
 * plus the permission gates and the predecessor/successor linkage that makes
 * the history chain walk work.
 */

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'SERVER_TIMESTAMP',
  },
  Timestamp: {
    now: () => ({ toMillis: () => 1700000000000, toDate: () => new Date(1700000000000) }),
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
const writes: Array<{ collection: string; id: string; op: 'set' | 'update'; payload: Record<string, unknown> }> = [];

let nextAutoId = 0;
function genAutoId(): string {
  nextAutoId += 1;
  return `auto-${nextAutoId}`;
}

function makeDocRef(collectionId: string, docId: string) {
  return {
    id: docId,
    collectionId,
    get: async () => {
      const state = collectionStore[collectionId]?.[docId] ?? { exists: false };
      return {
        exists: state.exists,
        data: () => state.data,
      };
    },
  };
}

const txMock = {
  get: async (ref: { collectionId: string; id: string }) => {
    const state = collectionStore[ref.collectionId]?.[ref.id] ?? { exists: false };
    return {
      exists: state.exists,
      data: () => state.data,
    };
  },
  set: (ref: { collectionId: string; id: string }, payload: Record<string, unknown>) => {
    writes.push({ collection: ref.collectionId, id: ref.id, op: 'set', payload });
    collectionStore[ref.collectionId] = collectionStore[ref.collectionId] ?? {};
    collectionStore[ref.collectionId][ref.id] = { exists: true, data: payload };
  },
  update: (ref: { collectionId: string; id: string }, payload: Record<string, unknown>) => {
    writes.push({ collection: ref.collectionId, id: ref.id, op: 'update', payload });
    collectionStore[ref.collectionId] = collectionStore[ref.collectionId] ?? {};
    const prev = collectionStore[ref.collectionId][ref.id]?.data ?? {};
    collectionStore[ref.collectionId][ref.id] = { exists: true, data: { ...prev, ...payload } };
  },
};

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: () => ({
    collection: (id: string) => ({
      doc: (docId?: string) => makeDocRef(id, docId ?? genAutoId()),
    }),
    runTransaction: async <T,>(fn: (tx: typeof txMock) => Promise<T>) => fn(txMock),
  }),
}));

jest.mock('../actionsLogService', () => ({
  serverCreateActionLog: jest.fn(async () => 'log-id'),
}));

jest.mock('../notificationService', () => ({
  serverCreateNotification: jest.fn(async () => 'notif-id'),
}));

import {
  serverRequestExchange,
  serverApproveExchangeRequest,
  serverRejectExchangeRequest,
  serverReplaceByAnother,
} from '../exchangeRequestService';
import { EquipmentStatus, ExchangeRequestStatus } from '@/types/equipment';
import { serverCreateActionLog } from '../actionsLogService';

function reset() {
  for (const k of Object.keys(collectionStore)) delete collectionStore[k];
  writes.length = 0;
  nextAutoId = 0;
  (serverCreateActionLog as jest.Mock).mockClear();
}

function seedEquipment(id: string, data: Partial<Record<string, unknown>>) {
  collectionStore['equipment'] = collectionStore['equipment'] ?? {};
  collectionStore['equipment'][id] = {
    exists: true,
    data: {
      id,
      productName: 'Test Rifle',
      currentHolderId: 'holder-uid',
      currentHolder: 'Holder Name',
      signedById: 'signer-uid',
      signedBy: 'Signer Name',
      status: EquipmentStatus.AVAILABLE,
      location: 'Base',
      trackingHistory: [],
      ...data,
    },
  };
}

function seedRequest(id: string, data: Partial<Record<string, unknown>>) {
  collectionStore['exchangeRequests'] = collectionStore['exchangeRequests'] ?? {};
  collectionStore['exchangeRequests'][id] = {
    exists: true,
    data: {
      equipmentDocId: 'eq-old',
      equipmentId: 'eq-old',
      equipmentName: 'Test Rifle',
      holderUserId: 'holder-uid',
      holderUserName: 'Holder Name',
      signerUserId: 'signer-uid',
      signerUserName: 'Signer Name',
      reason: 'Broken trigger',
      status: ExchangeRequestStatus.PENDING,
      statusHistory: [],
      ...data,
    },
  };
}

describe('exchangeRequestService', () => {
  beforeEach(reset);

  describe('serverRequestExchange', () => {
    it('creates pending request and flips equipment to EXCHANGE_REQUESTED', async () => {
      seedEquipment('eq-old', {});

      const result = await serverRequestExchange({
        equipmentDocId: 'eq-old',
        actorId: 'holder-uid',
        actorName: 'Holder Name',
        reason: 'Broken trigger',
      });

      expect(result.requestId).toMatch(/^auto-/);
      const reqWrite = writes.find((w) => w.collection === 'exchangeRequests' && w.op === 'set');
      expect(reqWrite?.payload).toMatchObject({
        status: ExchangeRequestStatus.PENDING,
        reason: 'Broken trigger',
        holderUserId: 'holder-uid',
        signerUserId: 'signer-uid',
      });
      const eqWrite = writes.find((w) => w.collection === 'equipment' && w.op === 'update');
      expect(eqWrite?.payload).toMatchObject({ status: EquipmentStatus.EXCHANGE_REQUESTED });
    });

    it('rejects when actor is not the current holder', async () => {
      seedEquipment('eq-old', { currentHolderId: 'someone-else' });
      await expect(
        serverRequestExchange({
          equipmentDocId: 'eq-old',
          actorId: 'holder-uid',
          actorName: 'Holder Name',
          reason: 'Broken trigger',
        })
      ).rejects.toThrow(/Only the current holder/);
    });

    it('rejects when equipment status is not AVAILABLE', async () => {
      seedEquipment('eq-old', { status: EquipmentStatus.EXCHANGE_REQUESTED });
      await expect(
        serverRequestExchange({
          equipmentDocId: 'eq-old',
          actorId: 'holder-uid',
          actorName: 'Holder Name',
          reason: 'Broken trigger',
        })
      ).rejects.toThrow(/must be AVAILABLE/);
    });

    it('rejects empty reason', async () => {
      seedEquipment('eq-old', {});
      await expect(
        serverRequestExchange({
          equipmentDocId: 'eq-old',
          actorId: 'holder-uid',
          actorName: 'Holder Name',
          reason: '   ',
        })
      ).rejects.toThrow(/Reason is required/);
    });
  });

  describe('serverApproveExchangeRequest', () => {
    it('atomically retires old doc + creates new with predecessor/successor link', async () => {
      seedEquipment('eq-old', {
        status: EquipmentStatus.EXCHANGE_REQUESTED,
        equipmentType: 'tmpl-1',
        category: 'cat-1',
        subcategory: 'sub-1',
        holderTeamId: 'team-1',
      });
      seedRequest('req-1', {});

      const result = await serverApproveExchangeRequest({
        requestId: 'req-1',
        actorId: 'signer-uid',
        actorName: 'Signer Name',
        newSerialNumber: 'eq-new',
      });

      expect(result.newEquipmentDocId).toBe('eq-new');

      // Old doc retired with successorDocId.
      const oldUpdate = writes.find(
        (w) => w.collection === 'equipment' && w.id === 'eq-old' && w.op === 'update'
      );
      expect(oldUpdate?.payload).toMatchObject({
        status: EquipmentStatus.RETIRED,
        successorDocId: 'eq-new',
      });

      // New doc created with predecessorDocId + inherited fields.
      const newSet = writes.find(
        (w) => w.collection === 'equipment' && w.id === 'eq-new' && w.op === 'set'
      );
      expect(newSet?.payload).toMatchObject({
        id: 'eq-new',
        predecessorDocId: 'eq-old',
        status: EquipmentStatus.AVAILABLE,
        condition: 'good',
        equipmentType: 'tmpl-1',
        category: 'cat-1',
        subcategory: 'sub-1',
        currentHolderId: 'holder-uid',
        signedById: 'signer-uid',
        holderTeamId: 'team-1',
      });

      // Request updated to APPROVED with newEquipmentDocId.
      const reqUpdate = writes.find(
        (w) => w.collection === 'exchangeRequests' && w.id === 'req-1' && w.op === 'update'
      );
      expect(reqUpdate?.payload).toMatchObject({
        status: ExchangeRequestStatus.APPROVED,
        newEquipmentDocId: 'eq-new',
      });
    });

    it('rejects when actor is not the signer', async () => {
      seedEquipment('eq-old', { status: EquipmentStatus.EXCHANGE_REQUESTED });
      seedRequest('req-1', {});
      await expect(
        serverApproveExchangeRequest({
          requestId: 'req-1',
          actorId: 'someone-else',
          actorName: 'X',
          newSerialNumber: 'eq-new',
        })
      ).rejects.toThrow(/Only the signer/);
    });

    it('rejects when request is not pending', async () => {
      seedEquipment('eq-old', { status: EquipmentStatus.EXCHANGE_REQUESTED });
      seedRequest('req-1', { status: ExchangeRequestStatus.REJECTED });
      await expect(
        serverApproveExchangeRequest({
          requestId: 'req-1',
          actorId: 'signer-uid',
          actorName: 'Signer',
          newSerialNumber: 'eq-new',
        })
      ).rejects.toThrow(/not pending/);
    });

    it('rejects duplicate serial number', async () => {
      seedEquipment('eq-old', { status: EquipmentStatus.EXCHANGE_REQUESTED });
      seedEquipment('eq-new', {});
      seedRequest('req-1', {});
      await expect(
        serverApproveExchangeRequest({
          requestId: 'req-1',
          actorId: 'signer-uid',
          actorName: 'Signer',
          newSerialNumber: 'eq-new',
        })
      ).rejects.toThrow(/already exists/);
    });

    it('rejects empty serial', async () => {
      seedEquipment('eq-old', { status: EquipmentStatus.EXCHANGE_REQUESTED });
      seedRequest('req-1', {});
      await expect(
        serverApproveExchangeRequest({
          requestId: 'req-1',
          actorId: 'signer-uid',
          actorName: 'Signer',
          newSerialNumber: '   ',
        })
      ).rejects.toThrow(/required/);
    });
  });

  describe('serverRejectExchangeRequest', () => {
    it('marks request REJECTED and reverts equipment to AVAILABLE', async () => {
      seedEquipment('eq-old', { status: EquipmentStatus.EXCHANGE_REQUESTED });
      seedRequest('req-1', {});

      await serverRejectExchangeRequest({
        requestId: 'req-1',
        actorId: 'signer-uid',
        actorName: 'Signer Name',
        reason: 'Not eligible',
      });

      const reqUpdate = writes.find(
        (w) => w.collection === 'exchangeRequests' && w.op === 'update'
      );
      expect(reqUpdate?.payload).toMatchObject({ status: ExchangeRequestStatus.REJECTED });

      const eqUpdate = writes.find((w) => w.collection === 'equipment' && w.op === 'update');
      expect(eqUpdate?.payload).toMatchObject({ status: EquipmentStatus.AVAILABLE });
    });

    it('rejects when actor is not the signer', async () => {
      seedEquipment('eq-old', { status: EquipmentStatus.EXCHANGE_REQUESTED });
      seedRequest('req-1', {});
      await expect(
        serverRejectExchangeRequest({
          requestId: 'req-1',
          actorId: 'holder-uid',
          actorName: 'X',
        })
      ).rejects.toThrow(/Only the signer/);
    });
  });

  describe('serverReplaceByAnother', () => {
    it('records approved ExchangeRequest with initiatedBySigner + retires old + creates new', async () => {
      seedEquipment('eq-old', { equipmentType: 'tmpl-1', category: 'cat-1' });

      const result = await serverReplaceByAnother({
        equipmentDocId: 'eq-old',
        actorId: 'signer-uid',
        actorName: 'Signer Name',
        newSerialNumber: 'eq-new',
        reason: 'Pre-emptive swap',
      });

      expect(result.newEquipmentDocId).toBe('eq-new');

      const reqSet = writes.find(
        (w) => w.collection === 'exchangeRequests' && w.op === 'set'
      );
      expect(reqSet?.payload).toMatchObject({
        initiatedBySigner: true,
        status: ExchangeRequestStatus.APPROVED,
        newEquipmentDocId: 'eq-new',
      });

      const oldUpdate = writes.find(
        (w) => w.collection === 'equipment' && w.id === 'eq-old' && w.op === 'update'
      );
      expect(oldUpdate?.payload).toMatchObject({
        status: EquipmentStatus.RETIRED,
        successorDocId: 'eq-new',
      });

      const newSet = writes.find(
        (w) => w.collection === 'equipment' && w.id === 'eq-new' && w.op === 'set'
      );
      expect(newSet?.payload).toMatchObject({
        predecessorDocId: 'eq-old',
        status: EquipmentStatus.AVAILABLE,
        condition: 'good',
      });
    });

    it('rejects when actor is not the signer', async () => {
      seedEquipment('eq-old', {});
      await expect(
        serverReplaceByAnother({
          equipmentDocId: 'eq-old',
          actorId: 'holder-uid',
          actorName: 'X',
          newSerialNumber: 'eq-new',
        })
      ).rejects.toThrow(/Only the signer/);
    });

    it('rejects when equipment not AVAILABLE', async () => {
      seedEquipment('eq-old', { status: EquipmentStatus.EXCHANGE_REQUESTED });
      await expect(
        serverReplaceByAnother({
          equipmentDocId: 'eq-old',
          actorId: 'signer-uid',
          actorName: 'Signer',
          newSerialNumber: 'eq-new',
        })
      ).rejects.toThrow(/must be AVAILABLE/);
    });
  });
});
