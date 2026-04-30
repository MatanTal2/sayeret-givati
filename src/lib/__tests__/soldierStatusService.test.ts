/**
 * Unit tests for soldierStatusService — roster join + status upsert. The
 * Admin SDK chain is faked with an in-memory collection map; mirrors the
 * permissionGrantsService test pattern.
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

interface DocRecord {
  id: string;
  data: Record<string, unknown>;
}

const store = new Map<string, DocRecord>();

function buildAdminDb() {
  function makeQuery(collectionName: string) {
    type Filter = (rec: DocRecord) => boolean;
    let filters: Filter[] = [];
    let limitCount: number | null = null;

    const api = {
      where(field: string, op: string, value: unknown) {
        filters = [
          ...filters,
          (rec: DocRecord) => {
            const v = rec.data[field];
            switch (op) {
              case '==':
                return v === value;
              default:
                return false;
            }
          },
        ];
        return api;
      },
      limit(n: number) {
        limitCount = n;
        return api;
      },
      async get() {
        let docs = [...store.entries()]
          .filter(([key]) => key.startsWith(`${collectionName}/`))
          .map(([key, rec]) => ({
            shortId: key.split('/').slice(1).join('/'),
            data: rec.data,
          }));
        for (const f of filters)
          docs = docs.filter((d) => f({ id: d.shortId, data: d.data }));
        if (limitCount !== null) docs = docs.slice(0, limitCount);
        return {
          empty: docs.length === 0,
          docs: docs.map((rec) => ({
            id: rec.shortId,
            data: () => rec.data,
          })),
        };
      },
    };
    return api;
  }

  return {
    collection(name: string) {
      return {
        doc(id: string) {
          const fullKey = `${name}/${id}`;
          return {
            id,
            async get() {
              const rec = store.get(fullKey);
              return {
                exists: !!rec,
                id,
                data: () => rec?.data ?? {},
              };
            },
            async set(data: Record<string, unknown>, options?: { merge?: boolean }) {
              const cur = store.get(fullKey);
              const merged: Record<string, unknown> = options?.merge && cur ? { ...cur.data } : {};
              for (const [k, v] of Object.entries(data)) {
                if (v === 'DELETE_SENTINEL') {
                  delete merged[k];
                } else {
                  merged[k] = v;
                }
              }
              store.set(fullKey, { id, data: merged });
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

import {
  SoldierStatusValidationError,
  serverListRoster,
  serverUpdateSoldierStatus,
} from '@/lib/db/server/soldierStatusService';

beforeEach(() => {
  store.clear();
});

describe('serverListRoster', () => {
  it('returns empty list when no roster sources exist', async () => {
    const out = await serverListRoster();
    expect(out).toEqual([]);
  });

  it('builds rows from authorized_personnel when no user profile exists', async () => {
    store.set('authorized_personnel/hash-a', {
      id: 'hash-a',
      data: { firstName: 'דוד', lastName: 'לוי' },
    });
    const out = await serverListRoster();
    expect(out).toEqual([
      { id: 'hash-a', firstName: 'דוד', lastName: 'לוי', platoon: 'מסייעת', status: 'בית' },
    ]);
  });

  it("prefers users' display fields over authorized_personnel for the same hash", async () => {
    store.set('authorized_personnel/hash-a', {
      id: 'hash-a',
      data: { firstName: 'OLD', lastName: 'NAME' },
    });
    store.set('users/uid-1', {
      id: 'uid-1',
      data: {
        militaryPersonalNumberHash: 'hash-a',
        firstName: 'NEW',
        lastName: 'NAME',
        teamId: 'platoon-1',
      },
    });
    const out = await serverListRoster();
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: 'hash-a',
      firstName: 'NEW',
      lastName: 'NAME',
      platoon: 'platoon-1',
      status: 'בית',
    });
  });

  it('overlays soldierStatus onto the joined row, including customStatus', async () => {
    store.set('authorized_personnel/hash-a', {
      id: 'hash-a',
      data: { firstName: 'A', lastName: 'A' },
    });
    store.set('soldierStatus/hash-a', {
      id: 'hash-a',
      data: {
        status: 'אחר',
        customStatus: 'קורס',
        updatedAt: { toMillis: () => 1700000000000 },
      },
    });
    const out = await serverListRoster();
    expect(out[0]).toMatchObject({
      id: 'hash-a',
      status: 'אחר',
      customStatus: 'קורס',
      updatedAtMs: 1700000000000,
    });
  });

  it('sorts roster by Hebrew full name', async () => {
    store.set('authorized_personnel/h2', {
      id: 'h2',
      data: { firstName: 'בן', lastName: 'דוד' },
    });
    store.set('authorized_personnel/h1', {
      id: 'h1',
      data: { firstName: 'אבי', lastName: 'כהן' },
    });
    const out = await serverListRoster();
    expect(out.map((r) => r.id)).toEqual(['h1', 'h2']);
  });
});

describe('serverUpdateSoldierStatus', () => {
  beforeEach(() => {
    store.set('authorized_personnel/hash-a', {
      id: 'hash-a',
      data: { firstName: 'A', lastName: 'A' },
    });
  });

  it('rejects empty id', async () => {
    await expect(
      serverUpdateSoldierStatus('', { status: 'בית' })
    ).rejects.toThrow(SoldierStatusValidationError);
  });

  it('rejects invalid status enum', async () => {
    await expect(
      serverUpdateSoldierStatus('hash-a', { status: 'GIBBERISH' as never })
    ).rejects.toThrow(/status must be one of/);
  });

  it("rejects status='אחר' without customStatus", async () => {
    await expect(
      serverUpdateSoldierStatus('hash-a', { status: 'אחר' })
    ).rejects.toThrow(/customStatus is required/);
  });

  it("rejects status='אחר' with empty customStatus", async () => {
    await expect(
      serverUpdateSoldierStatus('hash-a', { status: 'אחר', customStatus: '   ' })
    ).rejects.toThrow(/customStatus is required/);
  });

  it('rejects when no roster row exists for the hash', async () => {
    await expect(
      serverUpdateSoldierStatus('unknown-hash', { status: 'בית' })
    ).rejects.toThrow(/No matching soldier/);
  });

  it("accepts when only a user (no authorized_personnel) carries the hash", async () => {
    store.set('users/uid-1', {
      id: 'uid-1',
      data: { militaryPersonalNumberHash: 'hash-only-user', firstName: 'X', lastName: 'Y' },
    });
    await serverUpdateSoldierStatus('hash-only-user', { status: 'משמר' });
    const stored = store.get('soldierStatus/hash-only-user')!.data;
    expect(stored.status).toBe('משמר');
  });

  it('persists status + serverTimestamp on a fresh write', async () => {
    await serverUpdateSoldierStatus('hash-a', { status: 'משמר' });
    const stored = store.get('soldierStatus/hash-a')!.data;
    expect(stored.status).toBe('משמר');
    expect(stored.updatedAt).toBe('SERVER_TIMESTAMP');
    expect(stored.customStatus).toBeUndefined();
  });

  it("strips stale customStatus when status moves away from 'אחר'", async () => {
    await serverUpdateSoldierStatus('hash-a', { status: 'אחר', customStatus: 'קורס' });
    expect(store.get('soldierStatus/hash-a')!.data.customStatus).toBe('קורס');

    await serverUpdateSoldierStatus('hash-a', { status: 'בית' });
    const stored = store.get('soldierStatus/hash-a')!.data;
    expect(stored.status).toBe('בית');
    expect(stored.customStatus).toBeUndefined();
  });
});
