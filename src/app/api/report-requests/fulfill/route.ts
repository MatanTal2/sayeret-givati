import { NextResponse } from 'next/server';
import { serverFulfillReportRequest } from '@/lib/db/server/reportRequestService';
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
      // userId always taken from the verified actor — server verifies actor is a target of the request.
      await serverFulfillReportRequest({
        requestId: input.requestId,
        userId: actor.uid,
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] report-requests/fulfill POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
