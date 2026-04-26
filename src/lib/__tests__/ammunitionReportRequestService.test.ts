/**
 * Phase 6 — ammunitionReportRequestService validation tests.
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

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: jest.fn(() => {
    throw new Error('Test reached admin DB without setting up a fake');
  }),
}));

jest.mock('@/lib/db/server/actionsLogService', () => ({
  serverCreateActionLog: jest.fn(async () => 'log-id'),
}));
jest.mock('@/lib/db/server/notificationService', () => ({
  serverCreateNotification: jest.fn(async () => 'notif-id'),
  serverCreateBatchNotifications: jest.fn(async () => []),
}));

import {
  validateCreateReportRequestInput,
  serverCreateAmmunitionReportRequest,
  serverCancelAmmunitionReportRequest,
  serverListAmmunitionReportRequests,
} from '@/lib/db/server/ammunitionReportRequestService';
import { UserType } from '@/types/user';

const stubActor = { uid: 'manager', userType: UserType.MANAGER };

describe('validateCreateReportRequestInput', () => {
  it('accepts a well-formed INDIVIDUAL request', () => {
    const out = validateCreateReportRequestInput({
      actor: stubActor,
      actorUserName: 'Alice',
      scope: 'INDIVIDUAL',
      targetUserIds: ['u1'],
    });
    expect(out.scope).toBe('INDIVIDUAL');
    expect(out.targetUserIds).toEqual(['u1']);
  });

  it('accepts a well-formed TEAM request with team id', () => {
    const out = validateCreateReportRequestInput({
      actor: stubActor,
      actorUserName: 'Alice',
      scope: 'TEAM',
      targetTeamId: 'team-a',
    });
    expect(out.scope).toBe('TEAM');
    expect(out.targetTeamId).toBe('team-a');
  });

  it('rejects unknown scope', () => {
    expect(() =>
      validateCreateReportRequestInput({ scope: 'WHAT', actor: stubActor })
    ).toThrow(/scope must be/);
  });

  it('rejects INDIVIDUAL without targetUserIds', () => {
    expect(() =>
      validateCreateReportRequestInput({ scope: 'INDIVIDUAL', actor: stubActor })
    ).toThrow(/targetUserIds is required/);
  });

  it('rejects TEAM without team id and without pre-resolved targets', () => {
    expect(() =>
      validateCreateReportRequestInput({ scope: 'TEAM', actor: stubActor })
    ).toThrow(/targetTeamId or pre-resolved/);
  });

  it('rejects non-string templateIds', () => {
    expect(() =>
      validateCreateReportRequestInput({
        scope: 'ALL',
        actor: stubActor,
        templateIds: [1, 2],
      })
    ).toThrow(/templateIds must be an array of strings/);
  });
});

describe('admin DB reach', () => {
  it('serverListAmmunitionReportRequests', async () => {
    await expect(serverListAmmunitionReportRequests()).rejects.toThrow(/Test reached admin DB/);
  });

  it('serverCreateAmmunitionReportRequest with TEAM scope and pre-resolved ids', async () => {
    await expect(
      serverCreateAmmunitionReportRequest({
        actor: stubActor,
        actorUserName: 'Alice',
        scope: 'TEAM',
        targetUserIds: ['u1', 'u2'],
        targetTeamId: 'team-a',
      })
    ).rejects.toThrow(/Test reached admin DB/);
  });

  it('serverCancelAmmunitionReportRequest', async () => {
    await expect(
      serverCancelAmmunitionReportRequest({ actor: stubActor, requestId: 'req-1' })
    ).rejects.toThrow(/Test reached admin DB/);
  });
});
