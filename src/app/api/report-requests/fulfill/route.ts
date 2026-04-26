import { NextResponse } from 'next/server';
import { serverFulfillReportRequest } from '@/lib/db/server/reportRequestService';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input.requestId || !input.userId) {
      return NextResponse.json(
        { success: false, error: 'requestId and userId are required' },
        { status: 400 }
      );
    }
    // Server verifies userId is a target of the request.
    await serverFulfillReportRequest({
      requestId: input.requestId,
      userId: input.userId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] report-requests/fulfill POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
