/**
 * POST /api/cron/purge-credential-audit-log
 *
 * Daily retention sweep for `credentialAuditLog`. Council answer Q5=a — 1
 * year retention. Anything older than `ageDays` (default 365) is deleted.
 * Designed for Vercel Cron — see `vercel.json`.
 *
 * Auth: `Authorization: Bearer ${CRON_SECRET}`. Same shared secret the
 * sweep-account-deletions cron uses. Verification with
 * `crypto.timingSafeEqual` to avoid timing leaks.
 *
 * Production-project gate: refuses with 503 unless the project id is the
 * real prod project — guards against an accidentally-deployed preview
 * environment vaporising audit history on its first cron tick.
 *
 * Query flags:
 *  - `?dryRun=true` — examines but never writes. Safety net for the first
 *    manual hit.
 *  - `?ageDays=N` — override retention window. Clamped 1..3650. Default
 *    `CREDENTIAL_AUDIT_RETENTION_DAYS`.
 *  - `?maxDeletes=N` — per-invocation cap. Clamped 1..10000. Default 5000.
 *    A run that hits the cap returns `truncated: true` so the next tick
 *    picks up the rest.
 *
 * Response: `PurgeResult` body, plus a single `console.log` summary so the
 * Vercel function logs carry a retention trail.
 */
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import {
  CREDENTIAL_AUDIT_RETENTION_DAYS,
  serverPurgeCredentialAuditLog,
} from '@/lib/db/server/credentialAuditService';

const PROD_PROJECT_ID = 'sayeret-givati-1983';

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get('authorization') ?? '';
  const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function clampInt(raw: string | null, min: number, max: number, fallback: number): number | null {
  if (raw === null) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'cron_disabled', message: 'CRON_SECRET is not configured' },
      { status: 503 },
    );
  }

  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== PROD_PROJECT_ID) {
    return NextResponse.json(
      {
        success: false,
        error: 'wrong_project',
        message: `Cron disabled outside the prod project (current: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'unset'})`,
      },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === 'true';
  const ageDays = clampInt(
    url.searchParams.get('ageDays'),
    1,
    3650,
    CREDENTIAL_AUDIT_RETENTION_DAYS,
  );
  if (ageDays === null) {
    return NextResponse.json(
      { success: false, error: 'bad_age_days', message: 'ageDays must be a number 1..3650' },
      { status: 400 },
    );
  }
  const maxDeletes = clampInt(url.searchParams.get('maxDeletes'), 1, 10000, 5000);
  if (maxDeletes === null) {
    return NextResponse.json(
      { success: false, error: 'bad_max_deletes', message: 'maxDeletes must be a number 1..10000' },
      { status: 400 },
    );
  }

  console.log('[cron/purge-credential-audit-log] starting', { dryRun, ageDays, maxDeletes });
  try {
    const result = await serverPurgeCredentialAuditLog({ dryRun, ageDays, maxDeletes });
    console.log('[cron/purge-credential-audit-log] done', result);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/purge-credential-audit-log] FAILED', message);
    return NextResponse.json({ success: false, error: 'purge_failed', message }, { status: 500 });
  }
}
