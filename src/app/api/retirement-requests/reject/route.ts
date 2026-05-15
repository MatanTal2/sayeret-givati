import { NextResponse } from 'next/server';
import { serverRejectRetirementRequest } from '@/lib/db/server/retirementRequestService';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';

export async function POST(request: Request) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const input = rawBody ? JSON.parse(rawBody) : {};
      if (!input.requestId) {
        return NextResponse.json(
          { success: false, error: 'requestId is required' },
          { status: 400 }
        );
      }
      await serverRejectRetirementRequest({
        requestId: input.requestId,
        rejectorUserId: actor.uid,
        rejectorUserName: input.rejectorUserName || actor.displayName || actor.uid,
        ...(input.reason ? { reason: input.reason } : {}),
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] retirement-requests/reject POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
