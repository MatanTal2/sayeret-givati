import { NextResponse } from 'next/server';
import { serverBulkAddPersonnel } from '@/lib/db/server/authorizedPersonnelService';
import { getActorOrError } from '@/lib/db/server/auth';
import { UserType } from '@/types/user';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    if (actor.userType !== UserType.ADMIN && actor.userType !== UserType.SYSTEM_MANAGER) {
      return NextResponse.json({ success: false, error: 'Forbidden: admin/system_manager only' }, { status: 403 });
    }
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
