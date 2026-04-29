import { NextResponse } from 'next/server';
import { serverRejectTransferRequest } from '@/lib/db/server/transferRequestService';
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
    await serverRejectTransferRequest({
      ...input,
      rejectorUserId: actor.uid,
      rejectorUserName: input.rejectorUserName || actor.displayName || actor.uid,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] transfer-requests/reject POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
