import { NextResponse } from 'next/server';
import { serverApproveTemplateRequest } from '@/lib/db/server/templateRequestService';
import { validateActor, actorToAuthUser } from '@/lib/db/server/policyHelpers';
import { canReviewTemplate } from '@/lib/equipmentPolicy';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const actor = validateActor(input.actor);
    if (!canReviewTemplate(actorToAuthUser(actor))) {
      return NextResponse.json({ success: false, error: 'Forbidden — manager+ only' }, { status: 403 });
    }
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
