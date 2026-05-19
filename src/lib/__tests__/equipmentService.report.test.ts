/**
 * Light tests for `serverReportEquipment` — focusing on the condition
 * threading added 2026-05-19 (Phase 2 of equipment-report-and-history-fixes).
 *
 * Mocks the firebase-admin transaction surface enough to capture the
 * update payload and the action-log call.
 */

// ─── Mocks for firebase-admin chain ────────────────────────────────────────
jest.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    now: () => ({ toDate: () => new Date(), seconds: 0, nanoseconds: 0 }),
    fromDate: (d: Date) => ({ toDate: () => d, seconds: 0, nanoseconds: 0 }),
  },
  FieldValue: {
    serverTimestamp: () => 'SERVER_TIMESTAMP',
    arrayUnion: (...args: unknown[]) => ({ __op: 'arrayUnion', args }),
  },
}));

jest.mock('firebase-admin/app', () => ({
  initializeApp: () => ({}),
  getApps: () => [],
  cert: () => ({}),
  applicationDefault: () => ({}),
}));

// next/server: route uses `instanceof NextResponse` so we expose a class.
class FakeNextResponse {
  constructor(public status: number, public body: unknown) {}
}
jest.mock('next/server', () => ({
  NextResponse: Object.assign(FakeNextResponse, {
    json: (body: unknown, init?: { status?: number }) =>
      new FakeNextResponse(init?.status ?? 200, body),
  }),
}));

interface CapturedUpdate {
  path: string;
  payload: Record<string, unknown>;
}
const captured: { transactionUpdates: CapturedUpdate[]; getCount: number } = {
  transactionUpdates: [],
  getCount: 0,
};

const mockEquipmentDocSnap = {
  exists: true,
  data: () => ({
    id: 'eq-1',
    productName: 'M4',
    currentHolder: 'Holder',
    currentHolderId: 'u1',
    location: 'base',
    trackingHistory: [],
  }),
};

const mockTransaction = {
  get: jest.fn(async () => {
    captured.getCount += 1;
    return mockEquipmentDocSnap;
  }),
  update: jest.fn((ref: { path: string }, payload: Record<string, unknown>) => {
    captured.transactionUpdates.push({ path: ref.path, payload });
  }),
};

const mockEquipmentRef = {
  path: 'equipment/eq-1',
  get: jest.fn(async () => mockEquipmentDocSnap),
};

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => mockEquipmentRef),
    })),
    runTransaction: jest.fn(async (fn: (txn: typeof mockTransaction) => Promise<void>) => {
      await fn(mockTransaction);
    }),
  })),
}));

const mockCreateActionLog = jest.fn(async () => 'log-id');
jest.mock('@/lib/db/server/actionsLogService', () => ({
  serverCreateActionLog: (...args: unknown[]) =>
    mockCreateActionLog(...(args as Parameters<typeof mockCreateActionLog>)),
}));

jest.mock('@/lib/db/server/notificationService', () => ({
  serverCreateNotification: jest.fn(async () => 'notif-id'),
  serverCreateBatchNotifications: jest.fn(async () => undefined),
}));

jest.mock('@/lib/db/server/systemConfigService', () => ({
  serverGetSystemConfig: jest.fn(async () => ({ roundOpen: true })),
}));

import { serverReportEquipment } from '@/lib/db/server/equipmentService';
import { EquipmentCondition } from '@/types/equipment';

describe('serverReportEquipment — condition threading', () => {
  beforeEach(() => {
    captured.transactionUpdates = [];
    captured.getCount = 0;
    mockCreateActionLog.mockClear();
    mockTransaction.update.mockClear();
    mockTransaction.get.mockClear();
  });

  it('persists currentCondition on the equipment doc + condition on tracking entry', async () => {
    await serverReportEquipment({
      equipmentId: 'eq-1',
      actorId: 'u1',
      actorName: 'Actor',
      photoUrl: 'https://example.com/p.jpg',
      condition: EquipmentCondition.NEEDS_REPAIR,
      note: 'broken stock',
    });

    expect(captured.transactionUpdates).toHaveLength(1);
    const payload = captured.transactionUpdates[0].payload;
    expect(payload.currentCondition).toBe(EquipmentCondition.NEEDS_REPAIR);
    const trackingHistory = payload.trackingHistory as Array<Record<string, unknown>>;
    expect(trackingHistory).toHaveLength(1);
    const entry = trackingHistory[0];
    expect(entry.action).toBe('report_submitted');
    expect(entry.condition).toBe(EquipmentCondition.NEEDS_REPAIR);
    expect(entry.actor).toBe('Actor');
    expect(entry.photoUrl).toBe('https://example.com/p.jpg');
    expect(payload.lastReportPhotoUrl).toBe('https://example.com/p.jpg');
  });

  it('writes condition into actionsLog details', async () => {
    await serverReportEquipment({
      equipmentId: 'eq-1',
      actorId: 'u1',
      actorName: 'Actor',
      photoUrl: null,
      condition: EquipmentCondition.WORN,
    });

    expect(mockCreateActionLog).toHaveBeenCalledTimes(1);
    const logPayload = (mockCreateActionLog.mock.calls[0] as unknown[])[0] as {
      details?: { condition?: EquipmentCondition };
    };
    expect(logPayload.details?.condition).toBe(EquipmentCondition.WORN);
  });

  it('still works without a note (note is optional)', async () => {
    await serverReportEquipment({
      equipmentId: 'eq-1',
      actorId: 'u1',
      actorName: 'Actor',
      photoUrl: null,
      condition: EquipmentCondition.GOOD,
    });
    expect(captured.transactionUpdates[0].payload.currentCondition).toBe(
      EquipmentCondition.GOOD,
    );
  });
});

// ─── API route — input validation ────────────────────────────────────────
//
// The route validates that `condition` is present and in the enum. The
// underlying transaction must NOT run for an invalid request.

describe('POST /api/equipment/report — condition validation', () => {
  let postHandler: (request: Request) => Promise<{ status: number; body: { success: boolean; error?: string } }>;

  beforeAll(async () => {
    jest.doMock('@/lib/db/server/auth', () => ({
      getActorOrError: jest.fn(async () => ({
        uid: 'u1',
        userType: 'user',
        displayName: 'Actor',
      })),
    }));
    jest.doMock('@/lib/db/server/policyHelpers', () => ({
      actorToAuthUser: (a: { uid: string }) => ({ uid: a.uid, userType: 'user' }),
      fetchEquipmentForPolicy: jest.fn(async () => ({
        id: 'eq-1',
        currentHolderId: 'u1',
        status: 'available',
      })),
    }));
    jest.doMock('@/lib/db/server/idempotency', () => ({
      withIdempotency: async (
        _req: unknown,
        _actor: unknown,
        _body: unknown,
        fn: () => Promise<unknown>,
      ) => fn(),
    }));
    jest.doMock('@/lib/equipmentPolicy', () => ({
      canReport: () => true,
      canReportWithoutPhoto: () => true,
    }));
    jest.doMock('@/lib/db/server/equipmentService', () => ({
      serverReportEquipment: jest.fn(async () => undefined),
    }));

    // Import after the doMock calls so the route picks up the mocks.
    const mod = await import('@/app/api/equipment/report/route');
    postHandler = mod.POST as unknown as typeof postHandler;
  });

  function buildRequest(body: Record<string, unknown>): Request {
    return {
      headers: { get: (n: string) => (n.toLowerCase() === 'authorization' ? 'Bearer x' : null) },
      text: async () => JSON.stringify(body),
    } as unknown as Request;
  }

  it('rejects requests missing condition', async () => {
    const res = await postHandler(buildRequest({ equipmentId: 'eq-1' }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/condition/);
  });

  it('rejects requests with an invalid condition value', async () => {
    const res = await postHandler(
      buildRequest({ equipmentId: 'eq-1', condition: 'shiny' }),
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/condition/);
  });

  it('accepts a valid condition', async () => {
    const res = await postHandler(
      buildRequest({ equipmentId: 'eq-1', condition: EquipmentCondition.GOOD, photoUrl: null }),
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
