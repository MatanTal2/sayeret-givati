import { NextResponse } from 'next/server';
import { serverApproveTemplateRequest } from '@/lib/db/server/templateRequestService';
import { actorToAuthUser } from '@/lib/db/server/policyHelpers';
import { getActorOrError } from '@/lib/db/server/auth';
import { canReviewTemplate } from '@/lib/equipmentPolicy';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    if (!canReviewTemplate(actorToAuthUser(actor))) {
      return NextResponse.json({ success: false, error: 'Forbidden — manager+ only' }, { status: 403 });
    }
    const input = await request.json();
    if (!input.templateId) {
      return NextResponse.json({ success: false, error: 'templateId is required' }, { status: 400 });
    }
    await serverApproveTemplateRequest({
      templateId: input.templateId,
      approverUserId: actor.uid,
      approverUserName: input.approverUserName || actor.displayName || actor.uid,
      edits: input.edits,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment-templates/approve POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
