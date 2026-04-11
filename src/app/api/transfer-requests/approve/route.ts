import { NextResponse } from 'next/server';
import { serverApproveTransferRequest } from '@/lib/db/server/transferRequestService';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input.transferRequestId || !input.approverUserId || !input.approverUserName) {
      return NextResponse.json(
        { success: false, error: 'transferRequestId, approverUserId, and approverUserName are required' },
        { status: 400 }
      );
    }
    await serverApproveTransferRequest(input);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] transfer-requests/approve POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
