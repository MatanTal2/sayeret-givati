import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import {
  GuardScheduleValidationError,
  serverDeleteGuardSchedule,
  serverGetGuardSchedule,
  serverUpdateGuardSchedule,
} from '@/lib/db/server/guardScheduleService';
import type { UpdateGuardSchedulePatch } from '@/types/guardSchedule';

function mapErrorStatus(error: unknown): number {
  if (error instanceof GuardScheduleValidationError) return error.status;
  return 500;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const schedule = await serverGetGuardSchedule(id);
    if (!schedule) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }
    if (schedule.createdBy !== actor.uid) {
      return NextResponse.json({ success: false, error: 'Not the owner' }, { status: 403 });
    }
    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] guard-schedules GET[id] failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: mapErrorStatus(error) });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const body = (await request.json()) as Partial<UpdateGuardSchedulePatch> & { actorName?: string };
    const actorName = body.actorName?.trim() || actor.displayName || actor.uid;

    await serverUpdateGuardSchedule(id, {
      actorUid: actor.uid,
      actorName,
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.assignments !== undefined ? { assignments: body.assignments } : {}),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] guard-schedules PATCH failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: mapErrorStatus(error) });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const actorName = actor.displayName || actor.uid;
    await serverDeleteGuardSchedule(id, actor.uid, actorName);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] guard-schedules DELETE failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: mapErrorStatus(error) });
  }
}
