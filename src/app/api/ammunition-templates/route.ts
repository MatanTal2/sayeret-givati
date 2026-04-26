import { NextResponse } from 'next/server';
import {
  serverCreateAmmunitionTemplate,
  serverListAmmunitionTemplates,
  serverSeedCanonicalAmmunitionTemplates,
  validateAmmunitionTemplateInput,
} from '@/lib/db/server/ammunitionTemplatesService';
import { validateActor } from '@/lib/db/server/policyHelpers';
import { UserType } from '@/types/user';

function isAdminOrManager(userType: UserType): boolean {
  return (
    userType === UserType.ADMIN ||
    userType === UserType.SYSTEM_MANAGER ||
    userType === UserType.MANAGER
  );
}

export async function GET() {
  try {
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
    const input = await request.json();
    const actor = validateActor(input.actor);

    if (input.action === 'seed_canonical') {
      if (!isAdminOrManager(actor.userType)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: only admin/manager may seed canonical templates' },
          { status: 403 }
        );
      }
      const result = await serverSeedCanonicalAmmunitionTemplates(actor.uid);
      return NextResponse.json({ success: true, ...result });
    }

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
