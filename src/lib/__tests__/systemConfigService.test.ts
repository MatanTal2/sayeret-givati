/**
 * Phase 1 — systemConfigService input validation.
 *
 * Same scope as serverServices.test.ts: validate the helper, lean on the
 * sentinel admin DB mock to prove well-formed inputs reach Firestore.
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

import {
  validateSystemConfigPayload,
  serverGetSystemConfig,
  serverUpdateSystemConfig,
} from '@/lib/db/server/systemConfigService';

describe('systemConfigService.validateSystemConfigPayload', () => {
  it('returns empty object for an empty payload', () => {
    expect(validateSystemConfigPayload({})).toEqual({});
  });

  it('passes through a string recipient id', () => {
    const out = validateSystemConfigPayload({ ammoNotificationRecipientUserId: 'uid-1' });
    expect(out.ammoNotificationRecipientUserId).toBe('uid-1');
  });

  it('coerces null/empty/undefined recipient to empty string for clearing', () => {
    expect(validateSystemConfigPayload({ ammoNotificationRecipientUserId: null }))
      .toEqual({ ammoNotificationRecipientUserId: '' });
    expect(validateSystemConfigPayload({ ammoNotificationRecipientUserId: '' }))
      .toEqual({ ammoNotificationRecipientUserId: '' });
  });

  it('throws when recipient id is not a string', () => {
    expect(() =>
      validateSystemConfigPayload({ ammoNotificationRecipientUserId: 42 })
    ).toThrow(/must be a string/);
  });

  it('throws when payload is not an object', () => {
    expect(() => validateSystemConfigPayload(undefined)).toThrow(/payload is required/);
    expect(() => validateSystemConfigPayload(null)).toThrow(/payload is required/);
    expect(() => validateSystemConfigPayload('nope')).toThrow(/payload is required/);
  });
});

describe('systemConfigService — admin DB reach (proves validation passed)', () => {
  it('serverGetSystemConfig touches the admin DB', async () => {
    await expect(serverGetSystemConfig()).rejects.toThrow(/Test reached admin DB/);
  });

  it('serverUpdateSystemConfig touches the admin DB after validation', async () => {
    await expect(
      serverUpdateSystemConfig({
        payload: { ammoNotificationRecipientUserId: 'uid-1' },
        actorUserId: 'admin-uid',
      })
    ).rejects.toThrow(/Test reached admin DB/);
  });
});
