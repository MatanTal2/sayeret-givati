/**
 * Server-side idempotency helper. Wraps a mutation handler so duplicate
 * requests with the same `Idempotency-Key` header produce one effect.
 *
 * Lock-then-work pattern (M1 simplified):
 *   1. tx.create(_idempotency/{uid}_{key}, { requestHash, status:'pending', createdAt, expiresAt })
 *      → only one caller wins.
 *   2. Run the inner handler.
 *   3. Patch the record { status:'committed', snapshot }.
 *
 * ALREADY_EXISTS path:
 *   - Read the record.
 *   - If fingerprint differs → 422 IDEMPOTENCY_KEY_REUSED (M2).
 *   - If status:'committed' → return cached response (S1 snapshot policy).
 *   - If status:'pending' and not expired → short poll loop; otherwise steal.
 *
 * The exact atomic-with-data-write variant from the audit (M1) requires
 * threading a Transaction through every service. We ship the lock-based
 * version now — it has the same external guarantee (no double-write under
 * concurrent replay) with a tiny window where a crashed caller leaves a
 * `pending` record. Stale-pending stealing closes that window.
 *
 * Reference: docs/spec/offline-first.md Phase 4.
 */

import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import type { ApiActor } from './policyHelpers';

const TTL_HOURS = 24;
const PENDING_TIMEOUT_MS = 30_000;
const PENDING_POLL_INTERVAL_MS = 200;
const PENDING_POLL_ATTEMPTS = 25;

export type IdempotencySnapshot = {
  status: number;
  code?: string;
  resourceId?: string;
  createdIds?: string[];
  newUpdatedAt?: string;
  bodyHint: 'inline' | 'refetch';
  inlineBody?: unknown;
};

type StoredRecord = {
  requestHash: string;
  status: 'pending' | 'committed';
  createdAt: Timestamp;
  expiresAt: Timestamp;
  snapshot?: IdempotencySnapshot;
};

const SNAPSHOT_BYTE_CAP = 64 * 1024;

function sha256Hex(buf: string | Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

export function fingerprintRequest(method: string, path: string, body: string): string {
  return sha256Hex(`${method.toUpperCase()}|${path}|${sha256Hex(body)}`);
}

function nowPlusHoursTimestamp(hours: number): Timestamp {
  return Timestamp.fromMillis(Date.now() + hours * 3600 * 1000);
}

function snapshotToResponse(snapshot: IdempotencySnapshot): NextResponse {
  if (snapshot.bodyHint === 'inline' && snapshot.inlineBody !== undefined) {
    return NextResponse.json(snapshot.inlineBody, { status: snapshot.status });
  }
  // bodyHint:'refetch' — caller should refetch the resource. We still
  // return success so the client outbox dequeues this entry; the client
  // will pull fresh data on the next read path.
  return NextResponse.json(
    {
      success: snapshot.status >= 200 && snapshot.status < 300,
      idempotencyReplay: true,
      resourceId: snapshot.resourceId,
      newUpdatedAt: snapshot.newUpdatedAt,
    },
    { status: snapshot.status },
  );
}

function truncateSnapshot(snapshot: IdempotencySnapshot): IdempotencySnapshot {
  if (snapshot.bodyHint !== 'inline' || snapshot.inlineBody === undefined) {
    return snapshot;
  }
  const serialized = JSON.stringify(snapshot.inlineBody);
  if (Buffer.byteLength(serialized, 'utf8') <= SNAPSHOT_BYTE_CAP) return snapshot;
  return { ...snapshot, bodyHint: 'refetch', inlineBody: undefined };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type WithIdempotencyOptions = {
  /**
   * Build the response snapshot from a successful handler result. Default
   * stores `{ status: 200, bodyHint: 'refetch' }` — i.e., on duplicate
   * replay the client gets a success ack and refetches.
   */
  toSnapshot?: (result: NextResponse) => Promise<IdempotencySnapshot> | IdempotencySnapshot;
};

const DEFAULT_SNAPSHOT: IdempotencySnapshot = { status: 200, bodyHint: 'refetch' };

/**
 * Wrap a mutation route handler with idempotency dedupe.
 *
 * Usage in a route:
 *
 *   export async function POST(request: Request) {
 *     const actorOrError = await getActorOrError(request);
 *     if (actorOrError instanceof NextResponse) return actorOrError;
 *     const actor = actorOrError;
 *     const body = await request.text();
 *     return withIdempotency(request, actor, body, async () => {
 *       // do the work, return NextResponse
 *     });
 *   }
 *
 * If the request has no `Idempotency-Key` header, the wrapper skips the
 * dedupe path entirely — handler runs as before. Server-internal callers
 * (cron, admin scripts) do not need keys.
 */
export async function withIdempotency(
  request: Request,
  actor: ApiActor,
  rawBody: string,
  handler: () => Promise<NextResponse>,
  options: WithIdempotencyOptions = {},
): Promise<NextResponse> {
  const key = request.headers.get('idempotency-key') ?? request.headers.get('Idempotency-Key');
  if (!key) return handler();

  if (key.length < 8 || key.length > 200) {
    return NextResponse.json(
      { success: false, error: 'Invalid Idempotency-Key length' },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const requestHash = fingerprintRequest(request.method, url.pathname, rawBody);

  const docId = `${actor.uid}_${key}`;
  const ref = getAdminDb().collection(COLLECTIONS.IDEMPOTENCY).doc(docId);

  // Step 1: try to claim the lock.
  let acquired = false;
  try {
    await ref.create({
      requestHash,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: nowPlusHoursTimestamp(TTL_HOURS),
    } satisfies Omit<StoredRecord, 'createdAt' | 'expiresAt'> & {
      createdAt: FirebaseFirestore.FieldValue;
      expiresAt: Timestamp;
    });
    acquired = true;
  } catch (e: unknown) {
    const code = (e as { code?: number | string })?.code;
    if (code !== 6 && code !== 'already-exists') throw e;
  }

  if (acquired) {
    try {
      const response = await handler();
      const snapshot = truncateSnapshot(
        (await options.toSnapshot?.(response)) ?? DEFAULT_SNAPSHOT,
      );
      await ref.update({
        status: 'committed',
        snapshot,
      });
      return response;
    } catch (err) {
      // Handler failed — clear the lock so a retry can re-enter cleanly.
      await ref.delete().catch(() => {});
      throw err;
    }
  }

  // Did not acquire — record already exists. Inspect.
  for (let attempt = 0; attempt < PENDING_POLL_ATTEMPTS; attempt++) {
    const snap = await ref.get();
    if (!snap.exists) {
      // Lock was deleted (handler failed). Reattempt by recursing once.
      return withIdempotency(request, actor, rawBody, handler, options);
    }
    const data = snap.data() as StoredRecord;
    if (data.requestHash !== requestHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Idempotency key reused with a different payload',
          code: 'IDEMPOTENCY_KEY_REUSED',
        },
        { status: 422 },
      );
    }
    if (data.status === 'committed' && data.snapshot) {
      return snapshotToResponse(data.snapshot);
    }
    // Pending — check if stale.
    const createdMs = data.createdAt.toMillis();
    if (Date.now() - createdMs > PENDING_TIMEOUT_MS) {
      // Steal: delete and reattempt.
      await ref.delete().catch(() => {});
      return withIdempotency(request, actor, rawBody, handler, options);
    }
    await sleep(PENDING_POLL_INTERVAL_MS);
  }

  return NextResponse.json(
    { success: false, error: 'Idempotency check timed out' },
    { status: 504 },
  );
}
