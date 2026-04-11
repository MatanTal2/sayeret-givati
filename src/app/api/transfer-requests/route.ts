import { NextResponse } from 'next/server';
import { serverCreateTransferRequest } from '@/lib/db/server/transferRequestService';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input.equipmentDocId || !input.toUserId || !input.fromUserId) {
      return NextResponse.json(
        { success: false, error: 'equipmentDocId, toUserId, and fromUserId are required' },
        { status: 400 }
      );
    }
    const id = await serverCreateTransferRequest(input);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] transfer-requests POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
