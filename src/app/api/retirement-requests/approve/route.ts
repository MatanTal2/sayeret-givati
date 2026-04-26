import { NextResponse } from 'next/server';
import { serverApproveRetirementRequest } from '@/lib/db/server/retirementRequestService';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input.requestId || !input.approverUserId || !input.approverUserName) {
      return NextResponse.json(
        { success: false, error: 'requestId, approverUserId, and approverUserName are required' },
        { status: 400 }
      );
    }
    // Server enforces approver == request.holderUserId — no separate policy check.
    await serverApproveRetirementRequest({
      requestId: input.requestId,
      approverUserId: input.approverUserId,
      approverUserName: input.approverUserName,
      ...(input.note ? { note: input.note } : {}),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] retirement-requests/approve POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
