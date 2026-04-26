import { NextResponse } from 'next/server';
import { serverRejectRetirementRequest } from '@/lib/db/server/retirementRequestService';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input.requestId || !input.rejectorUserId || !input.rejectorUserName) {
      return NextResponse.json(
        { success: false, error: 'requestId, rejectorUserId, and rejectorUserName are required' },
        { status: 400 }
      );
    }
    await serverRejectRetirementRequest({
      requestId: input.requestId,
      rejectorUserId: input.rejectorUserId,
      rejectorUserName: input.rejectorUserName,
      ...(input.reason ? { reason: input.reason } : {}),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] retirement-requests/reject POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
