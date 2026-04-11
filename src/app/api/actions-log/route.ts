import { NextResponse } from 'next/server';
import { serverCreateActionLog } from '@/lib/db/server/actionsLogService';

/**
 * POST /api/actions-log
 * Creates an audit log entry via firebase-admin.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.actionType || !data.equipmentId || !data.actorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: actionType, equipmentId, actorId' },
        { status: 400 }
      );
    }

    const id = await serverCreateActionLog(data);
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
