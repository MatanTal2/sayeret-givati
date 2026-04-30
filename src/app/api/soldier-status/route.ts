import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import { serverListRoster } from '@/lib/db/server/soldierStatusService';

/**
 * GET /api/soldier-status
 *
 * Bearer-gated. Returns the joined roster (users ∪ authorized_personnel) with
 * each soldier's current status. Open to any authenticated user.
 */
export async function GET(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;

    const roster = await serverListRoster();
    return NextResponse.json({ success: true, soldiers: roster });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] soldier-status GET failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
