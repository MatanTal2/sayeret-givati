import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import {
  writeCredentialAuditEvent,
  listCredentialAuditForUser,
} from '@/lib/db/server/credentialAuditService';
import { UserType } from '@/types/user';
import type { CredentialAuditEventType } from '@/types/credentialAudit';

const ALLOWED_EVENT_TYPES: readonly CredentialAuditEventType[] = [
  'PASSWORD_CHANGED',
  'PHONE_CHANGED',
  'EMAIL_CHANGED',
  'PHONE_FORCE_RESET',
  'SESSIONS_REVOKED',
  'ACCOUNT_DELETION_REQUESTED',
  'ACCOUNT_DELETION_CANCELLED',
  'ACCOUNT_DELETED',
];

/**
 * POST /api/auth/audit
 * Body: { uid: string, eventType: CredentialAuditEventType, metadata?: object }
 *
 * Append a single credential-change event to `credentialAuditLog`. Caller
 * must be authenticated. Caller may log an event for their OWN uid; only
 * ADMIN / SYSTEM_MANAGER may log an event targeting another uid (used by
 * force-reset / admin override flows).
 *
 * Metadata is opt-in and event-specific. PASSWORD_CHANGED takes no
 * metadata. PHONE_CHANGED should pass `{ oldNumberHash, newNumberHash }`
 * (NEVER plaintext) once PR-C lands. SESSIONS_REVOKED takes no metadata.
 *
 * IP + User-Agent are captured server-side from request headers — the
 * client cannot forge them.
 */
export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const body = await request.json();
    if (!body?.uid || typeof body.uid !== 'string') {
      return NextResponse.json({ success: false, error: 'uid is required' }, { status: 400 });
    }
    if (!body?.eventType || !ALLOWED_EVENT_TYPES.includes(body.eventType)) {
      return NextResponse.json(
        { success: false, error: 'eventType must be one of: ' + ALLOWED_EVENT_TYPES.join(', ') },
        { status: 400 },
      );
    }
    if (body.metadata !== undefined && (typeof body.metadata !== 'object' || body.metadata === null || Array.isArray(body.metadata))) {
      return NextResponse.json({ success: false, error: 'metadata must be a plain object' }, { status: 400 });
    }

    const isElevated =
      actor.userType === UserType.ADMIN || actor.userType === UserType.SYSTEM_MANAGER;
    if (body.uid !== actor.uid && !isElevated) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: cannot log audit for another user' },
        { status: 403 },
      );
    }

    // Best-effort IP capture. Vercel sets x-forwarded-for; first hop in the
    // comma-separated list is the original client. May be empty in dev.
    const xff = request.headers.get('x-forwarded-for') ?? '';
    const ip = xff.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') ?? undefined;

    const id = await writeCredentialAuditEvent({
      uid: body.uid,
      actorUid: actor.uid,
      actorUserType: String(actor.userType),
      eventType: body.eventType as CredentialAuditEventType,
      ip: ip || undefined,
      userAgent,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] auth/audit POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

/**
 * GET /api/auth/audit?uid=<uid>&limit=<n>
 *
 * Returns the credential audit entries for the actor (default) or for a
 * different uid when the actor is ADMIN / SYSTEM_MANAGER. Bearer-token
 * authenticated. Newest first. `limit` clamped to [1, 100], defaults to 25.
 *
 * Response shape: `{ success: true, entries: CredentialAuditEntry[] }`.
 * `ip` and `userAgent` are intentionally surfaced to the user themselves —
 * the point of the "your account activity" view is to make those visible
 * so the user can spot foreign logins / device anomalies.
 */
export async function GET(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const url = new URL(request.url);
    const targetUid = url.searchParams.get('uid') || actor.uid;

    const isElevated =
      actor.userType === UserType.ADMIN || actor.userType === UserType.SYSTEM_MANAGER;
    if (targetUid !== actor.uid && !isElevated) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: cannot read audit for another user' },
        { status: 403 },
      );
    }

    const rawLimit = url.searchParams.get('limit');
    let limit = DEFAULT_LIMIT;
    if (rawLimit !== null) {
      const parsed = Number.parseInt(rawLimit, 10);
      if (!Number.isFinite(parsed) || parsed < 1) {
        return NextResponse.json(
          { success: false, error: 'limit must be a positive integer' },
          { status: 400 },
        );
      }
      limit = Math.min(parsed, MAX_LIMIT);
    }

    const entries = await listCredentialAuditForUser(targetUid, limit);
    return NextResponse.json({ success: true, entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] auth/audit GET failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
