/**
 * Light contract tests for the server-side services and helpers.
 *
 * The Firebase Admin SDK is heavy to fake for full transactional behavior, so
 * these tests focus on **input validation** + **pure helpers**. Deeper
 * integration tests (transactions, denormalized field sync, action-log writes,
 * notification fan-out) are deferred until we add a true admin SDK fake.
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

// next/server uses native Request which isn't available in jsdom.
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
    }),
  },
}));

const mockVerifyIdToken = jest.fn();
const mockGetUserDoc = jest.fn();

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: jest.fn(() => ({
    collection: () => ({
      doc: () => ({
        get: mockGetUserDoc,
      }),
    }),
  })),
  getAdminAuth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

jest.mock('@/lib/db/server/actionsLogService', () => ({
  serverCreateActionLog: jest.fn(async () => 'log-id'),
}));
jest.mock('@/lib/db/server/notificationService', () => ({
  serverCreateNotification: jest.fn(async () => 'notif-id'),
  serverCreateBatchNotifications: jest.fn(async () => undefined),
}));
jest.mock('@/lib/db/server/permissionGrantsService', () => ({
  getActiveGrants: jest.fn(async () => []),
}));

import { actorToAuthUser, type ApiActor } from '@/lib/db/server/policyHelpers';
import { getActorFromRequest, AuthError } from '@/lib/db/server/auth';
import { serverForceOps } from '@/lib/db/server/forceOpsService';
import { UserType } from '@/types/user';

// Minimal Request stub that exposes the headers API used by getActorFromRequest.
function buildRequest(headers: Record<string, string> = {}): Request {
  const headerMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
    },
  } as unknown as Request;
}

describe('auth.getActorFromRequest', () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
    mockGetUserDoc.mockReset();
  });

  it('throws AuthError 401 when Authorization header is missing', async () => {
    await expect(getActorFromRequest(buildRequest())).rejects.toMatchObject({
      status: 401,
    });
  });

  it('throws AuthError 401 when header lacks Bearer prefix', async () => {
    await expect(
      getActorFromRequest(buildRequest({ Authorization: 'token-only' }))
    ).rejects.toMatchObject({ status: 401 });
  });

  it('throws AuthError 401 when verifyIdToken rejects', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('expired'));
    await expect(
      getActorFromRequest(buildRequest({ Authorization: 'Bearer xxx' }))
    ).rejects.toMatchObject({ status: 401 });
  });

  it('throws AuthError 403 when user profile not found', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'u1' });
    mockGetUserDoc.mockResolvedValue({ exists: false, data: () => undefined });
    await expect(
      getActorFromRequest(buildRequest({ Authorization: 'Bearer xxx' }))
    ).rejects.toMatchObject({ status: 403 });
  });

  it('throws AuthError 403 when userType is missing on profile', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'u1' });
    mockGetUserDoc.mockResolvedValue({
      exists: true,
      data: () => ({ teamId: 'team-a' }),
    });
    await expect(
      getActorFromRequest(buildRequest({ Authorization: 'Bearer xxx' }))
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns ApiActor with verified userType + teamId', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'u1' });
    mockGetUserDoc.mockResolvedValue({
      exists: true,
      data: () => ({ userType: UserType.MANAGER, teamId: 'team-a', displayName: 'Alice' }),
    });
    const actor = await getActorFromRequest(
      buildRequest({ Authorization: 'Bearer good-token' })
    );
    expect(actor.uid).toBe('u1');
    expect(actor.userType).toBe(UserType.MANAGER);
    expect(actor.teamId).toBe('team-a');
    expect(actor.displayName).toBe('Alice');
    expect(actor.grants).toEqual([]);
  });

  it('AuthError exposes status property', () => {
    const err = new AuthError('x', 401);
    expect(err.status).toBe(401);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('policyHelpers.actorToAuthUser', () => {
  it('forwards identity + grants (defaulting empty)', () => {
    const actor: ApiActor = {
      uid: 'u1',
      userType: UserType.TEAM_LEADER,
      teamId: 'team-b',
      displayName: 'Bob',
    };
    const user = actorToAuthUser(actor);
    expect(user.uid).toBe('u1');
    expect(user.userType).toBe(UserType.TEAM_LEADER);
    expect(user.teamId).toBe('team-b');
    expect(user.displayName).toBe('Bob');
    expect(user.grants).toEqual([]);
  });

  it('preserves explicit grants', () => {
    const actor: ApiActor = {
      uid: 'u1',
      userType: UserType.USER,
      grants: [
        {
          id: 'g1',
          grantedRole: UserType.TEAM_LEADER,
          scope: 'team',
          scopeTeamId: 'team-x',
          expiresAtMs: Date.now() + 1000,
        },
      ],
    };
    const user = actorToAuthUser(actor);
    expect(user.grants).toHaveLength(1);
    expect(user.grants?.[0].grantedRole).toBe(UserType.TEAM_LEADER);
  });
});

describe('serverForceOps — input validation', () => {
  const baseInput = {
    equipmentDocIds: ['eq-1'],
    kind: 'holder' as const,
    targetUserId: 'target-uid',
    actorUserId: 'actor-uid',
    actorUserName: 'Actor',
    reason: 'emergency',
  };

  it('throws when equipmentDocIds is empty', async () => {
    await expect(
      serverForceOps({ ...baseInput, equipmentDocIds: [] })
    ).rejects.toThrow(/equipmentDocIds must not be empty/);
  });

  it('throws when reason is missing', async () => {
    await expect(
      serverForceOps({ ...baseInput, reason: '' })
    ).rejects.toThrow(/reason is required/);
  });
});
