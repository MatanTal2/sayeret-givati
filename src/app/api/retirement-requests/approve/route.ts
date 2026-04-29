import { NextResponse } from 'next/server';
import { serverApproveRetirementRequest } from '@/lib/db/server/retirementRequestService';
import { getActorOrError } from '@/lib/db/server/auth';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const input = await request.json();
    if (!input.requestId) {
      return NextResponse.json(
        { success: false, error: 'requestId is required' },
        { status: 400 }
      );
    }
    // Server enforces approver == request.holderUserId — no separate policy check.
    await serverApproveRetirementRequest({
      requestId: input.requestId,
      approverUserId: actor.uid,
      approverUserName: input.approverUserName || actor.displayName || actor.uid,
      ...(input.note ? { note: input.note } : {}),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] retirement-requests/approve POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
