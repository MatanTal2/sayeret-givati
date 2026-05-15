/**
 * POST /api/cron/sweep-idempotency
 *
 * Belt-and-braces sweeper for `_idempotency` records. Firestore TTL (set on
 * the `expiresAt` field via firebase/firestore.indexes.json `fieldOverrides`)
 * is the primary purge mechanism; this cron deletes anything still around
 * past `expiresAt + 24h` in case the TTL feature is misconfigured.
 *
 * Auth: `Authorization: Bearer ${CRON_SECRET}` — same shared secret used by
 * the other crons. Production-project gate.
 *
 * See docs/spec/offline-first.md Phase 4 (audit note S2).
 */
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/db/admin';
import { COLLECTIONS } from '@/lib/db/collections';

const PROD_PROJECT_ID = 'sayeret-givati-1983';
const SAFETY_BUFFER_HOURS = 24;
const DEFAULT_MAX_DELETES = 1000;

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

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'cron_disabled' },
      { status: 503 },
    );
  }
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== PROD_PROJECT_ID) {
    return NextResponse.json(
      { success: false, error: 'wrong_project' },
      { status: 503 },
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === 'true';
  const maxDeletesRaw = Number(url.searchParams.get('maxDeletes') ?? DEFAULT_MAX_DELETES);
  const maxDeletes = Number.isFinite(maxDeletesRaw)
    ? Math.max(1, Math.min(10_000, Math.trunc(maxDeletesRaw)))
    : DEFAULT_MAX_DELETES;

  const cutoff = Timestamp.fromMillis(Date.now() - SAFETY_BUFFER_HOURS * 3600 * 1000);
  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.IDEMPOTENCY)
    .where('expiresAt', '<', cutoff)
    .limit(maxDeletes)
    .get();

  let deleted = 0;
  if (!dryRun && !snap.empty) {
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted = snap.size;
  }

  console.log('[cron/sweep-idempotency]', {
    dryRun,
    examined: snap.size,
    deleted,
    truncated: snap.size === maxDeletes,
  });

  return NextResponse.json({
    success: true,
    dryRun,
    examined: snap.size,
    deleted,
    truncated: snap.size === maxDeletes,
  });
}
