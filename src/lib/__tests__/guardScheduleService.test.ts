/**
 * Tests for guardScheduleService — create / update / delete / share-clone +
 * audit-log + notification-on-share. Admin SDK is faked with an in-memory
 * collection map (mirrors soldierStatusService.test.ts).
 */
jest.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'SERVER_TIMESTAMP',
    delete: () => 'DELETE_SENTINEL',
  },
  Timestamp: {
    now: () => ({ toMillis: () => Date.now() }),
    fromMillis: (ms: number) => ({ toMillis: () => ms }),
  },
}));

jest.mock('firebase-admin/app', () => ({
  initializeApp: () => ({}),
  getApps: () => [],
  cert: () => ({}),
  applicationDefault: () => ({}),
}));

interface DocRecord { id: string; data: Record<string, unknown>; }

const store = new Map<string, DocRecord>();
let autoId = 0;

function buildAdminDb() {
  function makeQuery(collectionName: string) {
    type Filter = (rec: DocRecord) => boolean;
    let filters: Filter[] = [];
    let orderField: string | null = null;
    let orderDir: 'asc' | 'desc' = 'asc';
    let limitCount: number | null = null;
    const api = {
      where(field: string, op: string, value: unknown) {
        filters = [...filters, (rec) => {
          const v = rec.data[field];
          return op === '==' ? v === value : false;
        }];
        return api;
      },
      orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
        orderField = field;
        orderDir = dir;
        return api;
      },
      limit(n: number) { limitCount = n; return api; },
      async get() {
        let docs = [...store.entries()]
          .filter(([key]) => key.startsWith(`${collectionName}/`))
          .map(([key, rec]) => ({ shortId: key.split('/').slice(1).join('/'), data: rec.data }));
        for (const f of filters) docs = docs.filter((d) => f({ id: d.shortId, data: d.data }));
        if (orderField) {
          docs.sort((a, b) => {
            const av = a.data[orderField!] as number;
            const bv = b.data[orderField!] as number;
            return orderDir === 'asc' ? av - bv : bv - av;
          });
        }
        if (limitCount !== null) docs = docs.slice(0, limitCount);
        return {
          empty: docs.length === 0,
          docs: docs.map((rec) => ({ id: rec.shortId, data: () => rec.data })),
        };
      },
    };
    return api;
  }

  return {
    collection(name: string) {
      return {
        doc(id?: string) {
          const realId = id ?? `auto-${++autoId}`;
          const fullKey = `${name}/${realId}`;
          return {
            id: realId,
            async get() {
              const rec = store.get(fullKey);
              return { exists: !!rec, id: realId, data: () => rec?.data ?? {} };
            },
            async set(data: Record<string, unknown>) {
              store.set(fullKey, { id: realId, data });
            },
            async update(patch: Record<string, unknown>) {
              const cur = store.get(fullKey);
              if (!cur) throw new Error('not found');
              store.set(fullKey, { id: realId, data: { ...cur.data, ...patch } });
            },
          };
        },
        ...makeQuery(name),
      };
    },
  };
}

const mockAdminDb = buildAdminDb();

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: () => mockAdminDb,
  getAdminAuth: () => ({}),
}));

const actionLogs: Array<Record<string, unknown>> = [];
const notifications: Array<Record<string, unknown>> = [];

jest.mock('@/lib/db/server/actionsLogService', () => ({
  serverCreateActionLog: jest.fn(async (data: Record<string, unknown>) => {
    actionLogs.push(data);
    return `log-${actionLogs.length}`;
  }),
}));
jest.mock('@/lib/db/server/notificationService', () => ({
  serverCreateNotification: jest.fn(async (data: Record<string, unknown>) => {
    notifications.push(data);
    return `notif-${notifications.length}`;
  }),
}));

import {
  GuardScheduleValidationError,
  serverCreateGuardSchedule,
  serverGetGuardSchedule,
  serverListMyGuardSchedules,
  serverUpdateGuardSchedule,
  serverDeleteGuardSchedule,
  serverShareGuardScheduleCopy,
} from '@/lib/db/server/guardScheduleService';
import type { CreateGuardScheduleInput } from '@/types/guardSchedule';

const baseInput = (): CreateGuardScheduleInput => ({
  actorUid: 'creator-uid',
  actorName: 'מתן יוצר',
  title: 'לוח שמירות שבועי',
  config: {
    startAt: '2026-05-02T18:00',
    endAt: '2026-05-03T06:00',
    shiftDurationHours: 2,
    algorithm: 'random_fair',
    seed: 'fixed',
  },
  posts: [{ id: 'p1', name: 'שער ראשי', defaultHeadcount: 1, headcountWindows: [] }],
  roster: [
    { id: 'a', source: 'firestore', displayName: 'A' },
    { id: 'b', source: 'firestore', displayName: 'B' },
    { id: 'c', source: 'firestore', displayName: 'C' },
  ],
});

beforeEach(() => {
  store.clear();
  autoId = 0;
  actionLogs.length = 0;
  notifications.length = 0;
});

describe('serverCreateGuardSchedule', () => {
  it('creates the schedule + writes audit log', async () => {
    const { id } = await serverCreateGuardSchedule(baseInput());
    const got = await serverGetGuardSchedule(id);
    expect(got).not.toBeNull();
    expect(got!.title).toBe('לוח שמירות שבועי');
    expect(got!.shifts.length).toBeGreaterThan(0);
    expect(actionLogs).toHaveLength(1);
    expect(actionLogs[0]).toMatchObject({
      actionType: 'GUARD_SCHEDULE_CREATED',
      actorId: 'creator-uid',
    });
  });

  it('rejects when title empty', async () => {
    const input = baseInput();
    input.title = '   ';
    await expect(serverCreateGuardSchedule(input)).rejects.toBeInstanceOf(GuardScheduleValidationError);
  });

  it('rejects when posts empty', async () => {
    const input = baseInput();
    input.posts = [];
    await expect(serverCreateGuardSchedule(input)).rejects.toThrow(/post/);
  });

  it('rejects when roster empty', async () => {
    const input = baseInput();
    input.roster = [];
    await expect(serverCreateGuardSchedule(input)).rejects.toThrow(/person/);
  });

  it('rejects when shiftDurationHours out of range', async () => {
    const input = baseInput();
    input.config.shiftDurationHours = 0;
    await expect(serverCreateGuardSchedule(input)).rejects.toThrow(/shiftDurationHours/);
  });

  it('rejects when startAt >= endAt', async () => {
    const input = baseInput();
    input.config.endAt = input.config.startAt;
    await expect(serverCreateGuardSchedule(input)).rejects.toThrow(/before/);
  });
});

describe('serverListMyGuardSchedules', () => {
  it('returns only owner-created and skips soft-deleted', async () => {
    const a = await serverCreateGuardSchedule(baseInput());
    const otherInput = baseInput();
    otherInput.actorUid = 'someone-else';
    await serverCreateGuardSchedule(otherInput);
    const list = await serverListMyGuardSchedules('creator-uid');
    expect(list.map((s) => s.id)).toEqual([a.id]);

    await serverDeleteGuardSchedule(a.id, 'creator-uid', 'מתן יוצר');
    const after = await serverListMyGuardSchedules('creator-uid');
    expect(after).toEqual([]);
  });
});

describe('serverUpdateGuardSchedule', () => {
  it('updates assignments + recomputes stats + audits', async () => {
    const { id } = await serverCreateGuardSchedule(baseInput());
    actionLogs.length = 0;

    const before = await serverGetGuardSchedule(id);
    const newAssignments = before!.assignments.map((a) => ({ ...a, personIds: ['a'] }));
    await serverUpdateGuardSchedule(id, {
      actorUid: 'creator-uid',
      actorName: 'מתן יוצר',
      assignments: newAssignments,
    });
    const after = await serverGetGuardSchedule(id);
    expect(after!.assignments.every((a) => a.personIds[0] === 'a')).toBe(true);
    const aStat = after!.stats.find((s) => s.personId === 'a');
    expect(aStat!.shiftsAssigned).toBe(after!.shifts.length);
    expect(actionLogs[0]).toMatchObject({ actionType: 'GUARD_SCHEDULE_UPDATED' });
  });

  it('rejects update by non-owner', async () => {
    const { id } = await serverCreateGuardSchedule(baseInput());
    await expect(
      serverUpdateGuardSchedule(id, { actorUid: 'other', actorName: 'X', title: 'fail' }),
    ).rejects.toThrow(/owner/);
  });
});

describe('serverShareGuardScheduleCopy', () => {
  beforeEach(() => {
    // recipient must exist
    store.set('users/recipient-uid', {
      id: 'recipient-uid',
      data: { firstName: 'נמען', lastName: 'נשלח' },
    });
  });

  it('clones doc + writes notification + audits both sides', async () => {
    const { id } = await serverCreateGuardSchedule(baseInput());
    actionLogs.length = 0;

    const { newId } = await serverShareGuardScheduleCopy({
      sourceId: id,
      recipientUid: 'recipient-uid',
      actorUid: 'creator-uid',
      actorName: 'מתן יוצר',
    });
    expect(newId).not.toBe(id);

    const cloned = await serverGetGuardSchedule(newId);
    expect(cloned).not.toBeNull();
    expect(cloned!.createdBy).toBe('recipient-uid');
    expect(cloned!.createdByName).toBe('נמען נשלח');
    expect(cloned!.sourceScheduleId).toBe(id);
    expect(cloned!.assignments.every((a) => a.locked === false)).toBe(true);

    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      userId: 'recipient-uid',
      type: 'guard_schedule_shared',
      relatedGuardScheduleId: newId,
    });

    const types = actionLogs.map((l) => l.actionType);
    expect(types).toEqual(expect.arrayContaining(['GUARD_SCHEDULE_SHARED_FROM', 'GUARD_SCHEDULE_SHARED_TO']));
  });

  it('rejects when actor is not owner', async () => {
    const { id } = await serverCreateGuardSchedule(baseInput());
    await expect(
      serverShareGuardScheduleCopy({
        sourceId: id,
        recipientUid: 'recipient-uid',
        actorUid: 'someone-else',
        actorName: 'X',
      }),
    ).rejects.toThrow(/owner/);
  });

  it('rejects when sharing with self', async () => {
    const { id } = await serverCreateGuardSchedule(baseInput());
    await expect(
      serverShareGuardScheduleCopy({
        sourceId: id,
        recipientUid: 'creator-uid',
        actorUid: 'creator-uid',
        actorName: 'מתן יוצר',
      }),
    ).rejects.toThrow(/yourself/);
  });

  it('rejects when recipient user does not exist', async () => {
    const { id } = await serverCreateGuardSchedule(baseInput());
    await expect(
      serverShareGuardScheduleCopy({
        sourceId: id,
        recipientUid: 'no-such-user',
        actorUid: 'creator-uid',
        actorName: 'מתן יוצר',
      }),
    ).rejects.toThrow(/Recipient/);
  });
});
