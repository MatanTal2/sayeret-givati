import { NextResponse } from 'next/server';
import {
  serverTransitionTrainingPlan,
} from '@/lib/db/server/trainingPlanService';
import { getActorOrError } from '@/lib/db/server/auth';
import type { TrainingPlanAction } from '@/types/training';

const ACTIONS: TrainingPlanAction[] = ['approve', 'reject', 'cancel', 'complete'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const input = (await request.json()) as { action?: string; reason?: string; actorName?: string };
    if (typeof input.action !== 'string' || !ACTIONS.includes(input.action as TrainingPlanAction)) {
      return NextResponse.json(
        { success: false, error: `action must be one of ${ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const actorName: string =
      typeof input.actorName === 'string' && input.actorName.trim()
        ? input.actorName.trim()
        : actor.displayName || actor.uid;

    await serverTransitionTrainingPlan({
      actor,
      actorName,
      planId: id,
      action: input.action as TrainingPlanAction,
      ...(typeof input.reason === 'string' && input.reason.trim() ? { reason: input.reason.trim() } : {}),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /forbidden/i.test(message) ? 403 : /not found/i.test(message) ? 404 : 400;
    console.error('[API] training-plans PATCH failed:', message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
