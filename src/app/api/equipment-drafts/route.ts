import { NextResponse } from 'next/server';
import {
  serverCreateEquipmentDraft,
  serverUpdateEquipmentDraft,
  serverDeleteEquipmentDraft,
} from '@/lib/db/server/equipmentDraftService';
import { getActorOrError } from '@/lib/db/server/auth';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const input = await request.json();
    // userId always taken from the verified actor — drafts are owned by the caller.
    const result = await serverCreateEquipmentDraft({ ...input, userId: actor.uid });
    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment-drafts POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const input = await request.json();
    if (!input.draftId) {
      return NextResponse.json({ success: false, error: 'draftId is required' }, { status: 400 });
    }
    await serverUpdateEquipmentDraft(input);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment-drafts PUT failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const input = await request.json();
    if (!input.draftId) {
      return NextResponse.json({ success: false, error: 'draftId is required' }, { status: 400 });
    }
    await serverDeleteEquipmentDraft(input.draftId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment-drafts DELETE failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
