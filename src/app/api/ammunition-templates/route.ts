import { NextResponse } from 'next/server';
import {
  serverCreateAmmunitionTemplate,
  serverListAmmunitionTemplates,
  validateAmmunitionTemplateInput,
} from '@/lib/db/server/ammunitionTemplatesService';
import { getActorOrError } from '@/lib/db/server/auth';
import { UserType } from '@/types/user';

function isAdminOrManager(userType: UserType): boolean {
  return (
    userType === UserType.ADMIN ||
    userType === UserType.SYSTEM_MANAGER ||
    userType === UserType.MANAGER
  );
}

export async function GET(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const templates = await serverListAmmunitionTemplates();
    return NextResponse.json({ success: true, templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] ammunition-templates GET failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const input = await request.json();

    const isAdmin = isAdminOrManager(actor.userType);
    const isTeamLeader = actor.userType === UserType.TEAM_LEADER;
    if (!isAdmin && !isTeamLeader) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only admin/manager/team_leader may create templates' },
        { status: 403 }
      );
    }

    const requestedStatus = input.payload?.status as string | undefined;
    if (requestedStatus === 'CANONICAL' && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only admin/manager may create CANONICAL templates' },
        { status: 403 }
      );
    }

    const payload = validateAmmunitionTemplateInput({
      ...(input.payload || {}),
      createdBy: actor.uid,
    });

    const result = await serverCreateAmmunitionTemplate(payload);
    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] ammunition-templates POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
