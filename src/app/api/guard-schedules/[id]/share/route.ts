import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import {
  GuardScheduleValidationError,
  serverShareGuardScheduleCopy,
} from '@/lib/db/server/guardScheduleService';

function mapErrorStatus(error: unknown): number {
  if (error instanceof GuardScheduleValidationError) return error.status;
  return 500;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const body = (await request.json()) as { recipientUid?: string; actorName?: string };
    if (!body.recipientUid) {
      return NextResponse.json(
        { success: false, error: 'recipientUid is required' },
        { status: 400 },
      );
    }
    const actorName = body.actorName?.trim() || actor.displayName || actor.uid;

    const { newId } = await serverShareGuardScheduleCopy({
      sourceId: id,
      recipientUid: body.recipientUid,
      actorUid: actor.uid,
      actorName,
    });
    return NextResponse.json({ success: true, newId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] guard-schedules share failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: mapErrorStatus(error) });
  }
}
