import { NextResponse } from 'next/server';
import { serverRetireEquipment } from '@/lib/db/server/equipmentService';
import {
  actorToAuthUser,
  fetchEquipmentForPolicy,
} from '@/lib/db/server/policyHelpers';
import { getActorOrError } from '@/lib/db/server/auth';
import { canRetire } from '@/lib/equipmentPolicy';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const input = await request.json();

    if (!input.equipmentId) {
      return NextResponse.json({ success: false, error: 'equipmentId is required' }, { status: 400 });
    }
    if (!input.reason) {
      return NextResponse.json({ success: false, error: 'reason is required' }, { status: 400 });
    }

    const equipment = await fetchEquipmentForPolicy(input.equipmentId);
    const authUser = actorToAuthUser(actor);
    if (!canRetire({ user: authUser, equipment })) {
      return NextResponse.json(
        { success: false, error: 'Only the signer may retire this item' },
        { status: 403 }
      );
    }

    const outcome = await serverRetireEquipment({
      equipmentId: input.equipmentId,
      actorId: actor.uid,
      actorName: input.actorName || actor.displayName || actor.uid,
      reason: input.reason,
    });
    return NextResponse.json({ success: true, outcome });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment/retire POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
