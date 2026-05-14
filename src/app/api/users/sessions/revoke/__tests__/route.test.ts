/**
 * @jest-environment node
 *
 * Tests for POST /api/users/sessions/revoke — the "sign out other devices"
 * endpoint. Verifies bearer-auth requirement, sessionEpoch write, and
 * audit-log fire-and-forget behaviour (audit failure must not fail the
 * route response).
 */

import { UserType } from '@/types/user';

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
}));

jest.mock('firebase-admin/app', () => ({
  initializeApp: () => ({}),
  getApps: () => [],
  cert: () => ({}),
  applicationDefault: () => ({}),
}));

const updateMock = jest.fn(async () => undefined);
const verifyIdTokenMock = jest.fn();

jest.mock('@/lib/db/admin', () => ({
  getAdminAuth: () => ({ verifyIdToken: verifyIdTokenMock }),
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({ update: updateMock }),
    }),
  }),
}));

const writeAuditMock = jest.fn(async () => 'audit-id');
jest.mock('@/lib/db/server/credentialAuditService', () => ({
  writeCredentialAuditEvent: (args: unknown) => writeAuditMock(args),
}));

let actorOverride: { uid: string; userType: UserType } | null = null;
jest.mock('@/lib/db/server/auth', () => {
  const { NextResponse } = jest.requireActual('next/server');
  return {
    getActorOrError: jest.fn(async () => {
      if (!actorOverride) {
        return NextResponse.json({ success: false, error: 'unauth' }, { status: 401 });
      }
      return { ...actorOverride, grants: [] };
    }),
  };
});

import { POST } from '../route';

function makeRequest(token: string | null = 'fake-token'): Request {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request('http://x/api/users/sessions/revoke', { method: 'POST', headers });
}

beforeEach(() => {
  updateMock.mockClear();
  writeAuditMock.mockClear();
  verifyIdTokenMock.mockReset();
  actorOverride = null;
});

describe('POST /api/users/sessions/revoke', () => {
  it('returns 401 when actor unauthenticated', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns 401 when bearer is missing entirely', async () => {
    actorOverride = { uid: 'u1', userType: UserType.USER };
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(401);
  });

  it('returns 401 when token verify throws', async () => {
    actorOverride = { uid: 'u1', userType: UserType.USER };
    verifyIdTokenMock.mockRejectedValueOnce(new Error('expired'));
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns 400 when token has no auth_time claim', async () => {
    actorOverride = { uid: 'u1', userType: UserType.USER };
    verifyIdTokenMock.mockResolvedValueOnce({ auth_time: 0 });
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it('bumps sessionEpoch and writes audit on success', async () => {
    actorOverride = { uid: 'u1', userType: UserType.USER };
    verifyIdTokenMock.mockResolvedValueOnce({ auth_time: 1_700_000_000 });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.sessionEpochMs).toBe(1_700_000_000 * 1000);
    expect(updateMock).toHaveBeenCalledWith({ sessionEpoch: 1_700_000_000 * 1000 });
    expect(writeAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'u1',
        actorUid: 'u1',
        eventType: 'SESSIONS_REVOKED',
      }),
    );
  });

  it('succeeds even when audit write fails (fire-and-forget)', async () => {
    actorOverride = { uid: 'u1', userType: UserType.USER };
    verifyIdTokenMock.mockResolvedValueOnce({ auth_time: 1_700_000_000 });
    writeAuditMock.mockRejectedValueOnce(new Error('audit down'));
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalled();
  });
});
