import { NextResponse } from 'next/server';
import { serverCreateActionLog } from '@/lib/db/server/actionsLogService';
import { getActorOrError } from '@/lib/db/server/auth';

/**
 * POST /api/actions-log
 * Creates an audit log entry via firebase-admin. actorId always set from
 * the verified bearer identity — body field is overridden to prevent forgery.
 */
export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const data = await request.json();

    if (!data.actionType || !data.equipmentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: actionType, equipmentId' },
        { status: 400 }
      );
    }

    const id = await serverCreateActionLog({ ...data, actorId: actor.uid });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] actions-log POST failed:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
