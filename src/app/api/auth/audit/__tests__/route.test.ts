/**
 * @jest-environment node
 *
 * Tests for GET /api/auth/audit — the credential-audit read endpoint.
 *
 * Verifies bearer-auth requirement, self-scope default, elevation check
 * for cross-uid reads, and limit param parsing/clamping.
 *
 * Node env is required because the route imports `next/server`, which
 * touches the global `Request` constructor (jsdom omits it).
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

jest.mock('@/lib/db/admin', () => ({
  getAdminAuth: jest.fn(),
  getAdminDb: jest.fn(),
}));

const listMock = jest.fn();
jest.mock('@/lib/db/server/credentialAuditService', () => ({
  writeCredentialAuditEvent: jest.fn(),
  listCredentialAuditForUser: (uid: string, limit?: number) => listMock(uid, limit),
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

import { GET } from '../route';

function makeRequest(url: string): Request {
  return new Request(url, { headers: { Authorization: 'Bearer fake' } });
}

beforeEach(() => {
  listMock.mockReset();
  listMock.mockResolvedValue([
    { id: 'a1', uid: 'self-uid', eventType: 'PASSWORD_CHANGED' },
  ]);
  actorOverride = null;
});

describe('GET /api/auth/audit', () => {
  it('returns 401 when actor unauthenticated', async () => {
    const res = await GET(makeRequest('http://x/api/auth/audit'));
    expect(res.status).toBe(401);
  });

  it('defaults to actor.uid + default limit', async () => {
    actorOverride = { uid: 'self-uid', userType: UserType.USER };
    const res = await GET(makeRequest('http://x/api/auth/audit'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.entries).toHaveLength(1);
    expect(listMock).toHaveBeenCalledWith('self-uid', 25);
  });

  it('honours an explicit limit, clamped to 100', async () => {
    actorOverride = { uid: 'self-uid', userType: UserType.USER };
    await GET(makeRequest('http://x/api/auth/audit?limit=5'));
    expect(listMock).toHaveBeenLastCalledWith('self-uid', 5);
    await GET(makeRequest('http://x/api/auth/audit?limit=99999'));
    expect(listMock).toHaveBeenLastCalledWith('self-uid', 100);
  });

  it('rejects non-positive limit', async () => {
    actorOverride = { uid: 'self-uid', userType: UserType.USER };
    const res = await GET(makeRequest('http://x/api/auth/audit?limit=0'));
    expect(res.status).toBe(400);
  });

  it('blocks reads of another uid for non-elevated actor', async () => {
    actorOverride = { uid: 'self-uid', userType: UserType.USER };
    const res = await GET(makeRequest('http://x/api/auth/audit?uid=other-uid'));
    expect(res.status).toBe(403);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('permits elevated actor to read another uid', async () => {
    actorOverride = { uid: 'admin-uid', userType: UserType.ADMIN };
    const res = await GET(makeRequest('http://x/api/auth/audit?uid=target-uid'));
    expect(res.status).toBe(200);
    expect(listMock).toHaveBeenCalledWith('target-uid', 25);
  });

  it('permits SYSTEM_MANAGER cross-uid read', async () => {
    actorOverride = { uid: 'sys-uid', userType: UserType.SYSTEM_MANAGER };
    const res = await GET(makeRequest('http://x/api/auth/audit?uid=target-uid'));
    expect(res.status).toBe(200);
    expect(listMock).toHaveBeenCalledWith('target-uid', 25);
  });
});
