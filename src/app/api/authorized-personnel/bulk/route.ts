import { NextResponse } from 'next/server';
import { serverBulkAddPersonnel } from '@/lib/db/server/authorizedPersonnelService';

export async function POST(request: Request) {
  try {
    const { entries } = await request.json();
    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ success: false, error: 'entries array is required' }, { status: 400 });
    }
    const result = await serverBulkAddPersonnel(entries);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] authorized-personnel/bulk POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
