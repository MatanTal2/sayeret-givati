/**
 * Phase 8 — light contract tests for the server-side services and helpers.
 *
 * The Firebase Admin SDK is heavy to fake for full transactional behavior, so
 * these tests focus on **input validation** + **pure helpers**. Deeper
 * integration tests (transactions, denormalized field sync, action-log writes,
 * notification fan-out) are deferred until we add a true admin SDK fake.
 */

// ─── Mocks for firebase-admin chain ────────────────────────────────────────
// firebase-admin/firestore — stub Timestamp + FieldValue so imports resolve.
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

// admin DB factory — server services call getAdminDb(). Validation paths
// throw before reaching it; deeper tests would replace this with an
// in-memory fake.
jest.mock('@/lib/db/admin', () => ({
  getAdminDb: jest.fn(() => {
    throw new Error('Test reached admin DB without setting up a fake');
  }),
}));

// Side-effect helpers — make them no-ops so happy-path tests don't fan out.
jest.mock('@/lib/db/server/actionsLogService', () => ({
  serverCreateActionLog: jest.fn(async () => 'log-id'),
}));
jest.mock('@/lib/db/server/notificationService', () => ({
  serverCreateNotification: jest.fn(async () => 'notif-id'),
  serverCreateBatchNotifications: jest.fn(async () => undefined),
}));

import { validateActor, actorToAuthUser, type ApiActor } from '@/lib/db/server/policyHelpers';
import { serverForceOps } from '@/lib/db/server/forceOpsService';
import { UserType } from '@/types/user';

describe('policyHelpers.validateActor', () => {
  it('accepts a well-formed actor', () => {
    const actor = validateActor({
      uid: 'u1',
      userType: UserType.MANAGER,
      teamId: 'team-a',
      displayName: 'Alice',
    });
    expect(actor.uid).toBe('u1');
    expect(actor.userType).toBe(UserType.MANAGER);
    expect(actor.teamId).toBe('team-a');
    expect(actor.displayName).toBe('Alice');
  });

  it('throws when actor is missing entirely', () => {
    expect(() => validateActor(undefined)).toThrow(/actor is required/);
    expect(() => validateActor(null)).toThrow(/actor is required/);
    expect(() => validateActor('not-an-object')).toThrow(/actor is required/);
  });

  it('throws when uid is missing', () => {
    expect(() => validateActor({ userType: UserType.USER })).toThrow(/actor\.uid/);
  });

  it('throws when userType is missing', () => {
    expect(() => validateActor({ uid: 'u1' })).toThrow(/actor\.userType/);
  });

  it('strips optional fields when undefined', () => {
    const actor = validateActor({ uid: 'u1', userType: UserType.USER });
    expect(actor.teamId).toBeUndefined();
    expect(actor.displayName).toBeUndefined();
  });
});

describe('policyHelpers.actorToAuthUser', () => {
  it('preserves identity fields', () => {
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

  it('reaches the admin DB when input is well-formed (proves validation passed)', async () => {
    // The mocked getAdminDb throws a sentinel error. Reaching it means validation passed.
    await expect(serverForceOps(baseInput)).rejects.toThrow(/Test reached admin DB/);
  });
});
