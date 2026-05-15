import { NextResponse } from 'next/server';
import { serverCreateTransferRequest } from '@/lib/db/server/transferRequestService';
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
      if (!input.equipmentDocId || !input.toUserId) {
        return NextResponse.json(
          { success: false, error: 'equipmentDocId and toUserId are required' },
          { status: 400 }
        );
      }
      if (input.fromUserId && input.fromUserId !== actor.uid) {
        return NextResponse.json(
          { success: false, error: 'fromUserId must match the authenticated user' },
          { status: 403 }
        );
      }
      const id = await serverCreateTransferRequest({ ...input, fromUserId: actor.uid });
      return NextResponse.json({ success: true, id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] transfer-requests POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
