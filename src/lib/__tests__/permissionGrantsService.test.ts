/**
 * Unit tests for permissionGrantsService — issuance, revocation, list, and
 * the active-grant loader. The Admin SDK chain is faked with an in-memory
 * collection map so the tests don't depend on real Firestore.
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

interface DocRecord {
  id: string;
  data: Record<string, unknown>;
}

const store = new Map<string, DocRecord>();

const mockSet = jest.fn(async (id: string, data: Record<string, unknown>) => {
  store.set(id, { id, data });
});
const mockUpdate = jest.fn(async (id: string, patch: Record<string, unknown>) => {
  const cur = store.get(id);
  if (!cur) throw new Error('Not found');
  store.set(id, { id, data: { ...cur.data, ...patch } });
});
const mockNotify = jest.fn(async (_data?: unknown) => 'notif-id');

jest.mock('@/lib/db/server/notificationService', () => ({
  serverCreateNotification: (data: unknown) => mockNotify(data),
}));

let docCounter = 0;

function buildAdminDb() {
  function makeQuery(collectionName: string) {
    type Filter = (rec: DocRecord) => boolean;
    let filters: Filter[] = [];
    let orderField: string | null = null;
    let orderDir: 'asc' | 'desc' = 'asc';
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
              case '>':
                return typeof v === 'number' && typeof value === 'number' && v > value;
              default:
                return false;
            }
          },
        ];
        return api;
      },
      orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
        orderField = field;
        orderDir = dir;
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
        if (orderField) {
          docs = [...docs].sort((a, b) => {
            const av = a.data[orderField!] as number;
            const bv = b.data[orderField!] as number;
            return orderDir === 'asc' ? av - bv : bv - av;
          });
        }
        if (limitCount !== null) docs = docs.slice(0, limitCount);
        return {
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
        doc(id?: string) {
          const docId = id ?? `auto-${++docCounter}`;
          const fullKey = `${name}/${docId}`;
          return {
            id: docId,
            async get() {
              const rec = store.get(fullKey);
              return {
                exists: !!rec,
                id: docId,
                data: () => rec?.data ?? {},
              };
            },
            set: (data: Record<string, unknown>) => mockSet(fullKey, data),
            update: (patch: Record<string, unknown>) => mockUpdate(fullKey, patch),
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
  GrantValidationError,
  getActiveGrants,
  isGrantIssuer,
  serverIssueGrant,
  serverListGrants,
  serverRevokeGrant,
} from '@/lib/db/server/permissionGrantsService';
import { GrantStatus } from '@/types/permissionGrant';
import { UserType } from '@/types/user';

beforeEach(() => {
  store.clear();
  docCounter = 0;
  mockSet.mockClear();
  mockUpdate.mockClear();
  mockNotify.mockClear();
});

describe('isGrantIssuer', () => {
  it('admin and system manager are issuers; manager and TL are not', () => {
    expect(isGrantIssuer(UserType.ADMIN)).toBe(true);
    expect(isGrantIssuer(UserType.SYSTEM_MANAGER)).toBe(true);
    expect(isGrantIssuer(UserType.MANAGER)).toBe(false);
    expect(isGrantIssuer(UserType.TEAM_LEADER)).toBe(false);
    expect(isGrantIssuer(UserType.USER)).toBe(false);
  });
});

describe('serverIssueGrant — validation', () => {
  const baseInput = {
    userId: 'user-1',
    grantedRole: UserType.TEAM_LEADER,
    scope: 'team' as const,
    scopeTeamId: 'team-7',
    expiresAtMs: Date.now() + 3 * 24 * 60 * 60 * 1000,
    reason: 'fill in for week 5',
    issuerUid: 'admin-1',
    issuerUserType: UserType.ADMIN,
  };

  it('rejects non-issuer', async () => {
    await expect(
      serverIssueGrant({ ...baseInput, issuerUserType: UserType.MANAGER })
    ).rejects.toThrow(GrantValidationError);
  });

  it('rejects self-grant', async () => {
    await expect(
      serverIssueGrant({ ...baseInput, userId: baseInput.issuerUid })
    ).rejects.toThrow(/cannot grant a role to themselves/i);
  });

  it('rejects unsupported role', async () => {
    await expect(
      serverIssueGrant({ ...baseInput, grantedRole: UserType.ADMIN })
    ).rejects.toThrow(/grantedRole/);
  });

  it("rejects scope='team' without scopeTeamId", async () => {
    await expect(
      serverIssueGrant({ ...baseInput, scopeTeamId: undefined })
    ).rejects.toThrow(/scopeTeamId/);
  });

  it("rejects scope='all' from non-admin issuer", async () => {
    await expect(
      serverIssueGrant({
        ...baseInput,
        scope: 'all',
        scopeTeamId: undefined,
        issuerUserType: UserType.SYSTEM_MANAGER,
      })
    ).rejects.toThrow(/admin may issue scope='all'/i);
  });

  it('rejects empty reason', async () => {
    await expect(
      serverIssueGrant({ ...baseInput, reason: '   ' })
    ).rejects.toThrow(/reason is required/);
  });

  it('rejects past expiry', async () => {
    await expect(
      serverIssueGrant({ ...baseInput, expiresAtMs: Date.now() - 1 })
    ).rejects.toThrow(/in the future/);
  });

  it('rejects duration over 7 days', async () => {
    await expect(
      serverIssueGrant({
        ...baseInput,
        expiresAtMs: Date.now() + 8 * 24 * 60 * 60 * 1000,
      })
    ).rejects.toThrow(/7-day cap/);
  });

  it('persists a valid grant and notifies the grantee', async () => {
    const result = await serverIssueGrant(baseInput);
    expect(result.id).toBeTruthy();
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledTimes(1);
    const stored = [...store.values()][0].data;
    expect(stored.userId).toBe('user-1');
    expect(stored.grantedRole).toBe(UserType.TEAM_LEADER);
    expect(stored.scopeTeamId).toBe('team-7');
    expect(stored.status).toBe(GrantStatus.ACTIVE);
  });

  it('rejects an overlapping active grant for the same user/role/team', async () => {
    await serverIssueGrant(baseInput);
    await expect(serverIssueGrant(baseInput)).rejects.toThrow(/already exists/i);
  });
});

describe('serverRevokeGrant', () => {
  it('flips status to revoked and stamps audit fields', async () => {
    const created = await serverIssueGrant({
      userId: 'user-1',
      grantedRole: UserType.TEAM_LEADER,
      scope: 'team',
      scopeTeamId: 'team-7',
      expiresAtMs: Date.now() + 3 * 24 * 60 * 60 * 1000,
      reason: 'r',
      issuerUid: 'admin-1',
      issuerUserType: UserType.ADMIN,
    });

    await serverRevokeGrant({
      grantId: created.id,
      actorUid: 'admin-1',
      actorUserType: UserType.ADMIN,
      reason: 'mistake',
    });

    const stored = [...store.values()][0].data;
    expect(stored.status).toBe(GrantStatus.REVOKED);
    expect(stored.revokedBy).toBe('admin-1');
    expect(stored.revokeReason).toBe('mistake');
    expect(typeof stored.revokedAtMs).toBe('number');
  });

  it('rejects revocation by non-issuer', async () => {
    await expect(
      serverRevokeGrant({
        grantId: 'x',
        actorUid: 'm',
        actorUserType: UserType.MANAGER,
      })
    ).rejects.toThrow(GrantValidationError);
  });

  it('rejects revocation of a non-active grant', async () => {
    const created = await serverIssueGrant({
      userId: 'user-1',
      grantedRole: UserType.TEAM_LEADER,
      scope: 'team',
      scopeTeamId: 'team-7',
      expiresAtMs: Date.now() + 1000,
      reason: 'r',
      issuerUid: 'admin-1',
      issuerUserType: UserType.ADMIN,
    });
    await serverRevokeGrant({
      grantId: created.id,
      actorUid: 'admin-1',
      actorUserType: UserType.ADMIN,
    });
    await expect(
      serverRevokeGrant({
        grantId: created.id,
        actorUid: 'admin-1',
        actorUserType: UserType.ADMIN,
      })
    ).rejects.toThrow(/not active/);
  });
});

describe('getActiveGrants', () => {
  it('returns only active, non-expired grants for the user', async () => {
    const now = Date.now();
    await serverIssueGrant({
      userId: 'user-1',
      grantedRole: UserType.TEAM_LEADER,
      scope: 'team',
      scopeTeamId: 'team-7',
      expiresAtMs: now + 60_000,
      reason: 'r',
      issuerUid: 'admin-1',
      issuerUserType: UserType.ADMIN,
    });
    // Insert a manually-expired record straight into the store to avoid the
    // "expiresAtMs must be in the future" guard.
    store.set('permissionGrants/expired-1', {
      id: 'expired-1',
      data: {
        userId: 'user-1',
        grantedRole: UserType.MANAGER,
        scope: 'all',
        issuedBy: 'admin-1',
        issuedAtMs: now - 10_000,
        expiresAtMs: now - 1,
        reason: 'old',
        status: GrantStatus.ACTIVE,
      },
    });
    // Different user — must not appear.
    await serverIssueGrant({
      userId: 'user-2',
      grantedRole: UserType.TEAM_LEADER,
      scope: 'team',
      scopeTeamId: 'team-9',
      expiresAtMs: now + 60_000,
      reason: 'other',
      issuerUid: 'admin-1',
      issuerUserType: UserType.ADMIN,
    });

    const out = await getActiveGrants('user-1');
    expect(out).toHaveLength(1);
    expect(out[0].grantedRole).toBe(UserType.TEAM_LEADER);
    expect(out[0].scopeTeamId).toBe('team-7');
  });

  it('returns [] for empty uid', async () => {
    expect(await getActiveGrants('')).toEqual([]);
  });
});

describe('serverListGrants', () => {
  it('returns grants newest first with isExpired flag', async () => {
    const now = Date.now();
    await serverIssueGrant({
      userId: 'user-1',
      grantedRole: UserType.TEAM_LEADER,
      scope: 'team',
      scopeTeamId: 'team-7',
      expiresAtMs: now + 60_000,
      reason: 'fresh',
      issuerUid: 'admin-1',
      issuerUserType: UserType.ADMIN,
    });
    store.set('permissionGrants/expired', {
      id: 'expired',
      data: {
        userId: 'user-1',
        grantedRole: UserType.MANAGER,
        scope: 'all',
        issuedBy: 'admin-1',
        issuedAtMs: now - 10_000,
        expiresAtMs: now - 5_000,
        reason: 'old',
        status: GrantStatus.ACTIVE,
      },
    });

    const list = await serverListGrants({ includeExpired: true });
    expect(list.length).toBe(2);
    const expired = list.find((g) => g.id === 'expired')!;
    expect(expired.isExpired).toBe(true);
  });
});
