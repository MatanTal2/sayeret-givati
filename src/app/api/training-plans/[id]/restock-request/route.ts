import { NextResponse } from 'next/server';
import { serverCreateRestockRequest } from '@/lib/db/server/trainingPlanService';
import { getActorOrError } from '@/lib/db/server/auth';

export async function POST(
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

    const input = (await request.json()) as {
      templateId?: string;
      templateName?: string;
      shortfallQty?: number;
      note?: string;
      actorName?: string;
    };

    if (typeof input.templateId !== 'string' || !input.templateId.trim()) {
      return NextResponse.json({ success: false, error: 'templateId is required' }, { status: 400 });
    }
    if (typeof input.templateName !== 'string' || !input.templateName.trim()) {
      return NextResponse.json({ success: false, error: 'templateName is required' }, { status: 400 });
    }
    if (typeof input.shortfallQty !== 'number' || !Number.isFinite(input.shortfallQty) || input.shortfallQty <= 0) {
      return NextResponse.json({ success: false, error: 'shortfallQty must be positive' }, { status: 400 });
    }

    const actorName: string =
      typeof input.actorName === 'string' && input.actorName.trim()
        ? input.actorName.trim()
        : actor.displayName || actor.uid;

    await serverCreateRestockRequest({
      actor,
      actorName,
      planId: id,
      templateId: input.templateId.trim(),
      templateName: input.templateName.trim(),
      shortfallQty: input.shortfallQty,
      ...(typeof input.note === 'string' && input.note.trim() ? { note: input.note.trim() } : {}),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /forbidden/i.test(message) ? 403 : /not found/i.test(message) ? 404 : 400;
    console.error('[API] training-plans restock-request POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
