import { NextResponse } from 'next/server';
import { serverReportEquipment } from '@/lib/db/server/equipmentService';
import {
  validateActor,
  actorToAuthUser,
  fetchEquipmentForPolicy,
} from '@/lib/db/server/policyHelpers';
import { canReport, canReportWithoutPhoto } from '@/lib/equipmentPolicy';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const actor = validateActor(input.actor);

    if (!input.equipmentId) {
      return NextResponse.json({ success: false, error: 'equipmentId is required' }, { status: 400 });
    }

    const equipment = await fetchEquipmentForPolicy(input.equipmentId);
    const authUser = actorToAuthUser(actor);
    const ctx = { user: authUser, equipment };

    if (!canReport(ctx)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (input.photoUrl == null && !canReportWithoutPhoto(authUser)) {
      return NextResponse.json(
        { success: false, error: 'Photo is required for this actor' },
        { status: 400 }
      );
    }

    await serverReportEquipment({
      equipmentId: input.equipmentId,
      actorId: actor.uid,
      actorName: input.actorName || actor.displayName || actor.uid,
      photoUrl: input.photoUrl ?? null,
      ...(input.note ? { note: input.note } : {}),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment/report POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
