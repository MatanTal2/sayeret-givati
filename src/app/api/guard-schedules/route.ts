import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import {
  GuardScheduleValidationError,
  serverCreateGuardSchedule,
  serverListMyGuardSchedules,
} from '@/lib/db/server/guardScheduleService';
import type { CreateGuardScheduleInput } from '@/types/guardSchedule';

function mapErrorStatus(error: unknown): number {
  if (error instanceof GuardScheduleValidationError) return error.status;
  return 500;
}

/** GET /api/guard-schedules — list current user's saved schedules. */
export async function GET(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const schedules = await serverListMyGuardSchedules(actorOrError.uid);
    return NextResponse.json({ success: true, schedules });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] guard-schedules GET failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: mapErrorStatus(error) });
  }
}

/** POST /api/guard-schedules — create a schedule. Algorithm runs server-side. */
export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const body = (await request.json()) as Partial<CreateGuardScheduleInput> & { actorName?: string };
    const actorName = body.actorName?.trim() || actor.displayName || actor.uid;

    const { id } = await serverCreateGuardSchedule({
      actorUid: actor.uid,
      actorName,
      title: body.title ?? '',
      config: body.config!,
      posts: body.posts ?? [],
      roster: body.roster ?? [],
      ...(body.initialAssignments ? { initialAssignments: body.initialAssignments } : {}),
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] guard-schedules POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: mapErrorStatus(error) });
  }
}
