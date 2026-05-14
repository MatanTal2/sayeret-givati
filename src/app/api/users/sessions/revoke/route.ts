import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import { getAdminAuth, getAdminDb } from '@/lib/db/admin';
import { COLLECTIONS } from '@/lib/db/collections';
import { writeCredentialAuditEvent } from '@/lib/db/server/credentialAuditService';

/**
 * POST /api/users/sessions/revoke
 *
 * Sign out the caller from every OTHER device while keeping the current
 * one alive. Same mechanism as the phone-change confirm flow: bump
 * `users.sessionEpoch` to the calling device's `auth_time`, so every
 * other device whose token was minted earlier fails the fence in
 * `getActorFromRequest` on its next API hit.
 *
 * No admin cross-uid path here. If we add a "force-logout user X" admin
 * tool it gets its own route so the privileged path is auditable
 * separately from the self-service one.
 *
 * Writes a `SESSIONS_REVOKED` row to `credentialAuditLog` so the user
 * can see the action surface in the Account Activity section.
 */
export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const header =
      request.headers.get('authorization') ?? request.headers.get('Authorization') ?? '';
    const idToken = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing bearer token' },
        { status: 401 },
      );
    }

    let authTimeSeconds: number;
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken, true);
      authTimeSeconds = decoded.auth_time ?? 0;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 },
      );
    }
    if (!authTimeSeconds) {
      return NextResponse.json(
        { success: false, error: 'Token missing auth_time claim' },
        { status: 400 },
      );
    }

    const sessionEpochMs = authTimeSeconds * 1000;
    await getAdminDb().collection(COLLECTIONS.USERS).doc(actor.uid).update({
      sessionEpoch: sessionEpochMs,
    });

    try {
      const xff = request.headers.get('x-forwarded-for') ?? '';
      const ip = xff.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;
      const userAgent = request.headers.get('user-agent') ?? undefined;
      await writeCredentialAuditEvent({
        uid: actor.uid,
        actorUid: actor.uid,
        actorUserType: String(actor.userType),
        eventType: 'SESSIONS_REVOKED',
        ip,
        userAgent,
      });
    } catch (e) {
      console.warn('[sessions/revoke] audit-log write failed:', e);
    }

    return NextResponse.json({ success: true, sessionEpochMs });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] users/sessions/revoke POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
