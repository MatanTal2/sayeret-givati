import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import {
  serverRequestAccountDeletion,
  AccountDeletionHasAssetsError,
  AccountDeletionAlreadyRequestedError,
} from '@/lib/db/server/accountDeletionService';
import { writeCredentialAuditEvent } from '@/lib/db/server/credentialAuditService';
import type { DeleteRequest, DeleteResponse } from '@/types/accountDeletion';

/**
 * POST /api/users/account/delete
 * Body: { reason?: string }
 *
 * Self-serve soft-delete. Caller must be authenticated (bearer token).
 * Caller must have already completed Firebase password re-auth on the
 * client side — this route does NOT re-check re-auth freshness because
 * `getActorFromRequest` already enforces the sessionEpoch fence (set
 * during phone-change confirm). Password re-auth on the client is a UX
 * step-up, not a server-side gate.
 *
 * Pre-flight blocks if the user is still holding equipment, ammunition,
 * or has open transfer requests. Per Council Q3=a — block, never auto-
 * retire.
 *
 * On success: stamps `users/{uid}.deletionRequestedAt`, writes an
 * `ACCOUNT_DELETION_REQUESTED` audit row.
 */
export async function POST(request: Request): Promise<NextResponse<DeleteResponse>> {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) {
      return actorOrError as NextResponse<DeleteResponse>;
    }
    const actor = actorOrError;

    const body = (await request.json().catch(() => ({}))) as Partial<DeleteRequest>;
    const reason = typeof body?.reason === 'string' ? body.reason : undefined;

    await serverRequestAccountDeletion({ uid: actor.uid, reason });

    try {
      const xff = request.headers.get('x-forwarded-for') ?? '';
      const ip = xff.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;
      const userAgent = request.headers.get('user-agent') ?? undefined;
      await writeCredentialAuditEvent({
        uid: actor.uid,
        actorUid: actor.uid,
        actorUserType: String(actor.userType),
        eventType: 'ACCOUNT_DELETION_REQUESTED',
        ip,
        userAgent,
        ...(reason ? { metadata: { reason: reason.trim().slice(0, 500) } } : {}),
      });
    } catch (e) {
      console.warn('[accountDeletion] audit-log write failed:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AccountDeletionHasAssetsError) {
      return NextResponse.json(
        {
          success: false,
          error: 'has_outstanding_assets',
          code: 'has_outstanding_assets',
          outstanding: error.outstanding,
        },
        { status: 400 },
      );
    }
    if (error instanceof AccountDeletionAlreadyRequestedError) {
      return NextResponse.json(
        { success: false, error: 'already_requested', code: 'already_requested' },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] users/account/delete POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
