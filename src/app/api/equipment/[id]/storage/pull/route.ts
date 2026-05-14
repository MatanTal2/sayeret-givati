import { NextResponse } from 'next/server';
import { serverPullFromStorage } from '@/lib/db/server/equipmentService';
import { getActorOrError } from '@/lib/db/server/auth';
import {
  actorToAuthUser,
  fetchEquipmentForPolicy,
} from '@/lib/db/server/policyHelpers';
import { canPullFromStorage } from '@/lib/equipmentPolicy';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const { id } = await params;
    const equipment = await fetchEquipmentForPolicy(id);
    const authUser = actorToAuthUser(actor);
    if (!canPullFromStorage({ user: authUser, equipment })) {
      return NextResponse.json(
        { success: false, error: 'Only the current holder of a stored item may pull it from storage' },
        { status: 403 }
      );
    }

    // SystemConfig.roundOpen gate is re-checked inside the server service.
    await serverPullFromStorage({
      equipmentId: id,
      actorId: actor.uid,
      actorName: actor.displayName || actor.uid,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment/[id]/storage/pull POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
