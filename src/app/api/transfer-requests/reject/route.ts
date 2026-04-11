import { NextResponse } from 'next/server';
import { serverRejectTransferRequest } from '@/lib/db/server/transferRequestService';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input.transferRequestId || !input.rejectorUserId || !input.rejectorUserName) {
      return NextResponse.json(
        { success: false, error: 'transferRequestId, rejectorUserId, and rejectorUserName are required' },
        { status: 400 }
      );
    }
    await serverRejectTransferRequest(input);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] transfer-requests/reject POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
