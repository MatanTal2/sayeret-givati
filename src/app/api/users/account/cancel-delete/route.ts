import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import {
  serverCancelAccountDeletion,
  AccountDeletionNoPendingError,
} from '@/lib/db/server/accountDeletionService';
import { writeCredentialAuditEvent } from '@/lib/db/server/credentialAuditService';
import type { CancelDeleteResponse } from '@/types/accountDeletion';

/**
 * POST /api/users/account/cancel-delete
 *
 * Clears the caller's `deletionRequestedAt` field if a pending request
 * is in flight. Idempotent semantics: returns `no_pending_request` 400
 * when the user has no active deletion request.
 *
 * Self-serve only.
 */
export async function POST(request: Request): Promise<NextResponse<CancelDeleteResponse>> {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) {
      return actorOrError as NextResponse<CancelDeleteResponse>;
    }
    const actor = actorOrError;

    await serverCancelAccountDeletion(actor.uid);

    try {
      const xff = request.headers.get('x-forwarded-for') ?? '';
      const ip = xff.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;
      const userAgent = request.headers.get('user-agent') ?? undefined;
      await writeCredentialAuditEvent({
        uid: actor.uid,
        actorUid: actor.uid,
        actorUserType: String(actor.userType),
        eventType: 'ACCOUNT_DELETION_CANCELLED',
        ip,
        userAgent,
      });
    } catch (e) {
      console.warn('[accountDeletion] audit-log write failed:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AccountDeletionNoPendingError) {
      return NextResponse.json(
        { success: false, error: 'no_pending_request', code: 'no_pending_request' },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] users/account/cancel-delete POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
