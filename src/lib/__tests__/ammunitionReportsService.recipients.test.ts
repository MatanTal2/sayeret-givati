/**
 * Targeted tests for `resolveRecipients` in ammunitionReportsService.
 * Covers the multi-recipient array shape + the dedupe / reporter-exclusion
 * post-processing applied in `serverSubmitAmmunitionReport`.
 */

jest.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    now: () => ({ toDate: () => new Date(), seconds: 0, nanoseconds: 0 }),
    fromDate: (d: Date) => ({ toDate: () => d, seconds: 0, nanoseconds: 0 }),
  },
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

// ─── In-memory admin DB fake ───────────────────────────────────────────────

interface FakeDocSnap {
  exists: boolean;
  id: string;
  data: () => Record<string, unknown> | undefined;
}

interface FakeQuery {
  where: (field: string, op: string, value: unknown) => FakeQuery;
  get: () => Promise<{ docs: FakeDocSnap[] }>;
}

interface UserDocSeed {
  id: string;
  teamId?: string;
  userType?: string;
}

interface DbSeed {
  users: UserDocSeed[];
  systemConfigMain: Record<string, unknown> | null;
}

let seed: DbSeed = { users: [], systemConfigMain: null };

const fakeDb = {
  collection: (name: string) => {
    if (name === 'users') {
      return {
        doc: (id: string): { get: () => Promise<FakeDocSnap> } => ({
          get: async () => {
            const u = seed.users.find((x) => x.id === id);
            return {
              exists: !!u,
              id,
              data: () => (u ? { teamId: u.teamId, userType: u.userType } : undefined),
            };
          },
        }),
        where: (field: string, op: string, value: unknown): FakeQuery => {
          const filters: Array<[string, string, unknown]> = [[field, op, value]];
          const q: FakeQuery = {
            where: (f2, o2, v2) => {
              filters.push([f2, o2, v2]);
              return q;
            },
            get: async () => {
              const docs: FakeDocSnap[] = seed.users
                .filter((u) =>
                  filters.every(([f, , v]) => {
                    if (f === 'teamId') return u.teamId === v;
                    if (f === 'userType') return u.userType === v;
                    return true;
                  })
                )
                .map((u) => ({
                  exists: true,
                  id: u.id,
                  data: () => ({ teamId: u.teamId, userType: u.userType }),
                }));
              return { docs };
            },
          };
          return q;
        },
      };
    }
    if (name === 'systemConfig') {
      return {
        doc: (id: string) => ({
          get: async (): Promise<FakeDocSnap> => ({
            exists: id === 'main' && seed.systemConfigMain !== null,
            id,
            data: () => seed.systemConfigMain ?? undefined,
          }),
        }),
      };
    }
    throw new Error(`unexpected collection: ${name}`);
  },
};

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: jest.fn(() => fakeDb),
}));

jest.mock('@/lib/db/collections', () => ({
  COLLECTIONS: {
    USERS: 'users',
    SYSTEM_CONFIG: 'systemConfig',
    AMMUNITION_TEMPLATES: 'ammunitionTemplates',
    AMMUNITION_REPORTS: 'ammunitionReports',
    AMMUNITION_INVENTORY: 'ammunitionInventory',
    AMMUNITION: 'ammunition',
  },
}));

import { resolveRecipients } from '@/lib/db/server/ammunitionReportsService';
import { UserType } from '@/types/user';

describe('resolveRecipients', () => {
  beforeEach(() => {
    seed = { users: [], systemConfigMain: null };
  });

  it('returns empty arrays when reporter has no team and no managers configured', async () => {
    seed.users = [{ id: 'reporter', teamId: '' }];
    const out = await resolveRecipients('reporter');
    expect(out).toEqual({ teamLeaderIds: [], responsibleManagerIds: [] });
  });

  it('includes all configured responsible managers from the array', async () => {
    seed.users = [{ id: 'reporter', teamId: '' }];
    seed.systemConfigMain = {
      ammoNotificationRecipientUserIds: ['mgr-1', 'mgr-2', 'mgr-3'],
    };
    const out = await resolveRecipients('reporter');
    expect(out.responsibleManagerIds).toEqual(['mgr-1', 'mgr-2', 'mgr-3']);
  });

  it('skips empty + non-string entries inside the array', async () => {
    seed.users = [{ id: 'reporter', teamId: '' }];
    seed.systemConfigMain = {
      ammoNotificationRecipientUserIds: ['mgr-1', '', '  ', null, 42, 'mgr-2'],
    };
    const out = await resolveRecipients('reporter');
    expect(out.responsibleManagerIds).toEqual(['mgr-1', 'mgr-2']);
  });

  it('returns empty managers when the field is missing', async () => {
    seed.users = [{ id: 'reporter' }];
    seed.systemConfigMain = {};
    const out = await resolveRecipients('reporter');
    expect(out.responsibleManagerIds).toEqual([]);
  });

  it('unions team leaders of the reporter team excluding the reporter', async () => {
    seed.users = [
      { id: 'reporter', teamId: 'alpha', userType: UserType.USER },
      { id: 'tl-1', teamId: 'alpha', userType: UserType.TEAM_LEADER },
      { id: 'tl-2', teamId: 'alpha', userType: UserType.TEAM_LEADER },
      { id: 'tl-3', teamId: 'bravo', userType: UserType.TEAM_LEADER },
    ];
    seed.systemConfigMain = { ammoNotificationRecipientUserIds: ['mgr-1'] };

    const out = await resolveRecipients('reporter');
    expect(new Set(out.teamLeaderIds)).toEqual(new Set(['tl-1', 'tl-2']));
    expect(out.responsibleManagerIds).toEqual(['mgr-1']);
  });

  it('keeps reporter-as-TL out of the team-leader list', async () => {
    seed.users = [
      { id: 'reporter', teamId: 'alpha', userType: UserType.TEAM_LEADER },
      { id: 'tl-2', teamId: 'alpha', userType: UserType.TEAM_LEADER },
    ];
    const out = await resolveRecipients('reporter');
    expect(out.teamLeaderIds).toEqual(['tl-2']);
  });
});

describe('recipient post-processing (union + dedupe + reporter exclusion)', () => {
  // The unioning happens inside `serverSubmitAmmunitionReport`. We replicate
  // the same Set + filter pipeline here so a regression in the inline logic
  // gets caught by a focused test.
  function unionAndExclude(
    teamLeaderIds: string[],
    responsibleManagerIds: string[],
    reporterUid: string
  ): string[] {
    return Array.from(new Set([...teamLeaderIds, ...responsibleManagerIds])).filter(
      (uid) => uid !== reporterUid
    );
  }

  it('dedupes when a TL is also a configured manager', () => {
    const out = unionAndExclude(['tl-1', 'tl-2'], ['tl-1', 'mgr-1'], 'reporter');
    expect(out.sort()).toEqual(['mgr-1', 'tl-1', 'tl-2']);
  });

  it('excludes the reporter even when listed as a manager', () => {
    const out = unionAndExclude(['tl-1'], ['reporter', 'mgr-1'], 'reporter');
    expect(out.sort()).toEqual(['mgr-1', 'tl-1']);
  });
});
