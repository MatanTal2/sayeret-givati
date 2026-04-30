import { NextResponse } from 'next/server';
import { serverProposeTemplate } from '@/lib/db/server/templateRequestService';
import { actorToAuthUser } from '@/lib/db/server/policyHelpers';
import { getActorOrError } from '@/lib/db/server/auth';
import {
  canProposeTemplate,
  canRequestTemplate,
} from '@/lib/equipmentPolicy';
import { UserType } from '@/types/user';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const authUser = actorToAuthUser(actor);
    const input = await request.json();

    // Regular users go through request flow; TL+ go through proposal flow.
    const allowed =
      actor.userType === UserType.USER
        ? canRequestTemplate(authUser)
        : canProposeTemplate(authUser);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const required = ['name', 'category', 'subcategory', 'requiresSerialNumber', 'requiresDailyStatusCheck'];
    for (const key of required) {
      if (input[key] === undefined || input[key] === null) {
        return NextResponse.json(
          { success: false, error: `${key} is required` },
          { status: 400 }
        );
      }
    }

    const result = await serverProposeTemplate({
      proposerUserId: actor.uid,
      proposerUserName: input.proposerUserName || actor.displayName || actor.uid,
      proposerUserType: actor.userType,
      name: input.name,
      category: input.category,
      subcategory: input.subcategory,
      requiresSerialNumber: input.requiresSerialNumber,
      requiresDailyStatusCheck: input.requiresDailyStatusCheck,
      defaultCatalogNumber: input.defaultCatalogNumber,
      description: input.description,
      notes: input.notes,
      draftPayload: input.draftPayload,
    });
    return NextResponse.json({
      success: true,
      templateId: result.templateId,
      draftId: result.draftId,
      status: result.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment-templates/propose POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
