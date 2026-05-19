/**
 * Validation tests for the array-shaped recipient field on
 * `validateSystemConfigPayload`. Mirrors the patterns used in
 * `systemConfigService.test.ts` — admin DB is sentinel-mocked so we cover
 * input-shape behaviour without touching Firestore.
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
  AMMO_RECIPIENTS_MAX,
} from '@/lib/db/server/systemConfigService';

describe('validateSystemConfigPayload — ammoNotificationRecipientUserIds', () => {
  it('accepts an empty array', () => {
    expect(
      validateSystemConfigPayload({ ammoNotificationRecipientUserIds: [] })
    ).toEqual({ ammoNotificationRecipientUserIds: [] });
  });

  it('passes through a normalized array of uids', () => {
    expect(
      validateSystemConfigPayload({
        ammoNotificationRecipientUserIds: ['uid-1', 'uid-2', 'uid-3'],
      })
    ).toEqual({ ammoNotificationRecipientUserIds: ['uid-1', 'uid-2', 'uid-3'] });
  });

  it('coerces null and undefined to an empty array', () => {
    expect(
      validateSystemConfigPayload({ ammoNotificationRecipientUserIds: null })
    ).toEqual({ ammoNotificationRecipientUserIds: [] });
    expect(
      validateSystemConfigPayload({ ammoNotificationRecipientUserIds: undefined })
    ).toEqual({ ammoNotificationRecipientUserIds: [] });
  });

  it('throws when the value is not an array', () => {
    expect(() =>
      validateSystemConfigPayload({ ammoNotificationRecipientUserIds: 'uid-1' })
    ).toThrow(/must be an array/);
    expect(() =>
      validateSystemConfigPayload({ ammoNotificationRecipientUserIds: 42 })
    ).toThrow(/must be an array/);
  });

  it('throws when entries are not strings', () => {
    expect(() =>
      validateSystemConfigPayload({
        ammoNotificationRecipientUserIds: ['uid-1', 42 as unknown as string],
      })
    ).toThrow(/entries must be strings/);
  });

  it('throws when entries contain only whitespace', () => {
    expect(() =>
      validateSystemConfigPayload({
        ammoNotificationRecipientUserIds: ['uid-1', '   '],
      })
    ).toThrow(/non-empty/);
  });

  it('rejects duplicate uids', () => {
    expect(() =>
      validateSystemConfigPayload({
        ammoNotificationRecipientUserIds: ['uid-1', 'uid-1'],
      })
    ).toThrow(/duplicate/);
  });

  it('trims whitespace inside entries', () => {
    expect(
      validateSystemConfigPayload({
        ammoNotificationRecipientUserIds: ['  uid-1  ', 'uid-2'],
      })
    ).toEqual({ ammoNotificationRecipientUserIds: ['uid-1', 'uid-2'] });
  });

  it('enforces the maximum length cap', () => {
    const overflow = Array.from({ length: AMMO_RECIPIENTS_MAX + 1 }, (_, i) => `uid-${i}`);
    expect(() =>
      validateSystemConfigPayload({ ammoNotificationRecipientUserIds: overflow })
    ).toThrow(/exceeds the maximum/);

    const atCap = Array.from({ length: AMMO_RECIPIENTS_MAX }, (_, i) => `uid-${i}`);
    expect(
      validateSystemConfigPayload({ ammoNotificationRecipientUserIds: atCap })
    ).toEqual({ ammoNotificationRecipientUserIds: atCap });
  });
});
