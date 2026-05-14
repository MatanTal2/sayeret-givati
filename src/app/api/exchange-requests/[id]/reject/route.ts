import { NextResponse } from 'next/server';
import { serverRejectExchangeRequest } from '@/lib/db/server/exchangeRequestService';
import { getActorOrError } from '@/lib/db/server/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const { id } = await params;
    const input = await request.json();

    // Server enforces rejector == request.signerUserId via the doc check.
    await serverRejectExchangeRequest({
      requestId: id,
      actorId: actor.uid,
      actorName: actor.displayName || actor.uid,
      reason: input.reason,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] exchange-requests/[id]/reject POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
