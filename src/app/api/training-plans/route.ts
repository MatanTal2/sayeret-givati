import { NextResponse } from 'next/server';
import {
  serverCreateTrainingPlan,
  validateCreateTrainingPlanInput,
} from '@/lib/db/server/trainingPlanService';
import { getActorOrError } from '@/lib/db/server/auth';
import { UserType } from '@/types/user';

function isTeamLeaderOrAbove(userType: UserType): boolean {
  return (
    userType === UserType.ADMIN ||
    userType === UserType.SYSTEM_MANAGER ||
    userType === UserType.MANAGER ||
    userType === UserType.TEAM_LEADER
  );
}

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    if (!isTeamLeaderOrAbove(actor.userType)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only team leaders and above may plan trainings' },
        { status: 403 }
      );
    }

    const input = await request.json();
    const payload = validateCreateTrainingPlanInput(input.payload ?? input);
    const plannedByName: string =
      typeof input.plannedByName === 'string' && input.plannedByName.trim()
        ? input.plannedByName.trim()
        : actor.displayName || actor.uid;

    const result = await serverCreateTrainingPlan({ actor, plannedByName, payload });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /forbidden/i.test(message) ? 403 : 400;
    console.error('[API] training-plans POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
