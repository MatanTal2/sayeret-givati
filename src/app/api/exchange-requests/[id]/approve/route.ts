import { NextResponse } from 'next/server';
import { serverApproveExchangeRequest } from '@/lib/db/server/exchangeRequestService';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const { id } = await params;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const input = rawBody ? JSON.parse(rawBody) : {};
      if (!input.newSerialNumber || typeof input.newSerialNumber !== 'string' || !input.newSerialNumber.trim()) {
        return NextResponse.json({ success: false, error: 'newSerialNumber is required' }, { status: 400 });
      }

      // Server enforces approver == request.signerUserId via the doc check.
      const result = await serverApproveExchangeRequest({
        requestId: id,
        actorId: actor.uid,
        actorName: actor.displayName || actor.uid,
        newSerialNumber: input.newSerialNumber,
        note: input.note,
      });
      return NextResponse.json({ success: true, newEquipmentDocId: result.newEquipmentDocId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] exchange-requests/[id]/approve POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
