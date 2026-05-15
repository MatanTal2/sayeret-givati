import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';
import { serverCancelPhoneChange } from '@/lib/db/server/phoneChangeService';
import type { CancelResponse } from '@/types/phoneChange';

/**
 * POST /api/users/phone-change/cancel
 *
 * Idempotently clears any pending phone-change reservation for the
 * authenticated user. Called on modal close mid-flow, or after the
 * client receives `auth/credential-already-in-use` from
 * `updatePhoneNumber` so the orphan pending doesn't block a retry with
 * a different number for the rate-limit window.
 *
 * Self-serve only — actor.uid is the only target. (Admin force-reset is
 * a separate planned PR, Q4=b.)
 */
export async function POST(request: Request): Promise<NextResponse<CancelResponse>> {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) {
    return actorOrError as NextResponse<CancelResponse>;
  }
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      await serverCancelPhoneChange(actor.uid);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] users/phone-change/cancel POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }) as Promise<NextResponse<CancelResponse>>;
}
