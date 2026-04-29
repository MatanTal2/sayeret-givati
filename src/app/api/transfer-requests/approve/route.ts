import { NextResponse } from 'next/server';
import { serverApproveTransferRequest } from '@/lib/db/server/transferRequestService';
import { getActorOrError } from '@/lib/db/server/auth';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const input = await request.json();
    if (!input.transferRequestId) {
      return NextResponse.json(
        { success: false, error: 'transferRequestId is required' },
        { status: 400 }
      );
    }
    await serverApproveTransferRequest({
      ...input,
      approverUserId: actor.uid,
      approverUserName: input.approverUserName || actor.displayName || actor.uid,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] transfer-requests/approve POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
