/**
 * Tests for the server-side user profile updater. Locks in:
 *  - whitelist enforcement (unknown top-level keys dropped silently)
 *  - communicationPreferences shape validation (unknown keys reject, non-boolean reject)
 *  - dotted-path writes so partial patches don't clobber sibling pref flags
 *  - meta fields (updatedAt + comm-pref lastUpdated/updatedBy) populated
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

const capturedWrites: Record<string, unknown>[] = [];
const updateMock = jest.fn(async (data: Record<string, unknown>) => {
  capturedWrites.push(data);
});
const docMock = jest.fn(() => ({ update: updateMock }));
const collectionMock = jest.fn(() => ({ doc: docMock }));

jest.mock('@/lib/db/admin', () => ({
  getAdminDb: jest.fn(() => ({ collection: collectionMock })),
}));

import {
  serverUpdateUserProfile,
  InvalidProfileUpdateError,
} from '../userService';

beforeEach(() => {
  updateMock.mockClear();
  docMock.mockClear();
  collectionMock.mockClear();
  capturedWrites.length = 0;
});

describe('serverUpdateUserProfile', () => {
  it('no-ops when no whitelisted fields are present', async () => {
    await serverUpdateUserProfile('u1', { phoneNumber: '+972500000000' } as unknown as Parameters<typeof serverUpdateUserProfile>[1]);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('writes whitelisted string fields with updatedAt', async () => {
    await serverUpdateUserProfile('u1', { teamId: 'alpha', address: '5th Ave' });
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(capturedWrites[0]).toEqual({
      teamId: 'alpha',
      address: '5th Ave',
      updatedAt: 'SERVER_TIMESTAMP',
    });
  });

  it('writes communicationPreferences via dotted paths so siblings survive', async () => {
    await serverUpdateUserProfile(
      'u1',
      { communicationPreferences: { emailNotifications: false } },
      'actor-uid',
    );
    expect(updateMock).toHaveBeenCalledTimes(1);
    const payload = capturedWrites[0];
    expect(payload['communicationPreferences.emailNotifications']).toBe(false);
    expect(payload['communicationPreferences.lastUpdated']).toBe('SERVER_TIMESTAMP');
    expect(payload['communicationPreferences.updatedBy']).toBe('actor-uid');
    expect(payload.updatedAt).toBe('SERVER_TIMESTAMP');
    // sibling flags must NOT be in the patch
    expect(payload).not.toHaveProperty('communicationPreferences.equipmentTransferAlerts');
  });

  it('defaults actorUid to the subject uid when omitted', async () => {
    await serverUpdateUserProfile('u1', {
      communicationPreferences: { equipmentTransferAlerts: true },
    });
    expect(capturedWrites[0]['communicationPreferences.updatedBy']).toBe('u1');
  });

  it('rejects unknown communicationPreferences keys', async () => {
    await expect(
      serverUpdateUserProfile('u1', {
        communicationPreferences: { foo: true } as unknown as Parameters<typeof serverUpdateUserProfile>[1]['communicationPreferences'],
      }),
    ).rejects.toBeInstanceOf(InvalidProfileUpdateError);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('rejects non-boolean communicationPreferences values', async () => {
    await expect(
      serverUpdateUserProfile('u1', {
        communicationPreferences: { emailNotifications: 'yes' as unknown as boolean },
      }),
    ).rejects.toBeInstanceOf(InvalidProfileUpdateError);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('rejects non-object communicationPreferences payloads', async () => {
    await expect(
      serverUpdateUserProfile('u1', {
        communicationPreferences: 'enabled' as unknown as Parameters<typeof serverUpdateUserProfile>[1]['communicationPreferences'],
      }),
    ).rejects.toBeInstanceOf(InvalidProfileUpdateError);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('drops unknown top-level fields silently (whitelist gate)', async () => {
    await serverUpdateUserProfile('u1', {
      teamId: 'alpha',
      permissions: ['admin:everything'],
    } as unknown as Parameters<typeof serverUpdateUserProfile>[1]);
    expect(capturedWrites[0]).toEqual({ teamId: 'alpha', updatedAt: 'SERVER_TIMESTAMP' });
  });
});
