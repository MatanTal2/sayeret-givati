/**
 * @jest-environment node
 *
 * Tests for POST /api/cron/purge-credential-audit-log. Validates the four
 * guards in order — CRON_SECRET set, prod-project gate, bearer auth, query
 * clamping — plus the happy path forwarding to `serverPurgeCredentialAuditLog`.
 *
 * The underlying service is mocked here; its own behaviour is covered in
 * `credentialAuditServicePurge.test.ts`.
 */

const purgeMock = jest.fn();
jest.mock('@/lib/db/server/credentialAuditService', () => ({
  serverPurgeCredentialAuditLog: purgeMock,
  CREDENTIAL_AUDIT_RETENTION_DAYS: 365,
}));

import { POST } from '../route';

const PROD_PROJECT_ID = 'sayeret-givati-1983';

function mkRequest(opts: { secret?: string; url?: string } = {}): Request {
  const headers = new Headers();
  if (opts.secret !== undefined) headers.set('authorization', `Bearer ${opts.secret}`);
  return new Request(opts.url ?? 'https://example.com/api/cron/purge-credential-audit-log', {
    method: 'POST',
    headers,
  });
}

const originalEnv = { ...process.env };

beforeEach(() => {
  purgeMock.mockReset();
  process.env = { ...originalEnv };
  process.env.CRON_SECRET = 'test-secret';
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = PROD_PROJECT_ID;
});

afterAll(() => {
  process.env = originalEnv;
});

describe('POST /api/cron/purge-credential-audit-log', () => {
  it('503 when CRON_SECRET unset', async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(mkRequest({ secret: 'anything' }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toMatchObject({ success: false, error: 'cron_disabled' });
    expect(purgeMock).not.toHaveBeenCalled();
  });

  it('503 when project id is not the prod project', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'some-preview-project';
    const res = await POST(mkRequest({ secret: 'test-secret' }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toMatchObject({ success: false, error: 'wrong_project' });
    expect(purgeMock).not.toHaveBeenCalled();
  });

  it('401 when bearer token missing', async () => {
    const res = await POST(mkRequest());
    expect(res.status).toBe(401);
  });

  it('401 when bearer token wrong', async () => {
    const res = await POST(mkRequest({ secret: 'wrong-secret' }));
    expect(res.status).toBe(401);
  });

  it('400 when ageDays is not numeric', async () => {
    const res = await POST(
      mkRequest({
        secret: 'test-secret',
        url: 'https://example.com/api/cron/purge-credential-audit-log?ageDays=banana',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('bad_age_days');
  });

  it('clamps ageDays to 1..3650', async () => {
    purgeMock.mockResolvedValue({ deleted: 0, examined: 0 });
    await POST(
      mkRequest({
        secret: 'test-secret',
        url: 'https://example.com/api/cron/purge-credential-audit-log?ageDays=9999',
      }),
    );
    expect(purgeMock).toHaveBeenCalledWith(
      expect.objectContaining({ ageDays: 3650 }),
    );

    purgeMock.mockClear();
    await POST(
      mkRequest({
        secret: 'test-secret',
        url: 'https://example.com/api/cron/purge-credential-audit-log?ageDays=0',
      }),
    );
    expect(purgeMock).toHaveBeenCalledWith(
      expect.objectContaining({ ageDays: 1 }),
    );
  });

  it('passes dryRun=true through', async () => {
    purgeMock.mockResolvedValue({ deleted: 0, examined: 0 });
    await POST(
      mkRequest({
        secret: 'test-secret',
        url: 'https://example.com/api/cron/purge-credential-audit-log?dryRun=true',
      }),
    );
    expect(purgeMock).toHaveBeenCalledWith(
      expect.objectContaining({ dryRun: true }),
    );
  });

  it('returns 200 with service result on success', async () => {
    const result = {
      examined: 10,
      deleted: 10,
      failed: 0,
      dryRun: false,
      ageDays: 365,
      cutoff: '2025-05-14T00:00:00.000Z',
      durationMs: 5,
      truncated: false,
    };
    purgeMock.mockResolvedValue(result);
    const res = await POST(mkRequest({ secret: 'test-secret' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, ...result });
  });

  it('500 when service throws', async () => {
    purgeMock.mockRejectedValue(new Error('boom'));
    const res = await POST(mkRequest({ secret: 'test-secret' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({ success: false, error: 'purge_failed' });
  });
});
