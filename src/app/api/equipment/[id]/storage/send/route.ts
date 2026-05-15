import { NextResponse } from 'next/server';
import { serverSendToStorage } from '@/lib/db/server/equipmentService';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';
import {
  actorToAuthUser,
  fetchEquipmentForPolicy,
} from '@/lib/db/server/policyHelpers';
import { canSendToStorage } from '@/lib/equipmentPolicy';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;

  const { id } = await params;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const equipment = await fetchEquipmentForPolicy(id);
      const authUser = actorToAuthUser(actor);
      if (!canSendToStorage({ user: authUser, equipment })) {
        return NextResponse.json(
          { success: false, error: 'Only the current holder of an available item may send it to storage' },
          { status: 403 }
        );
      }

      await serverSendToStorage({
        equipmentId: id,
        actorId: actor.uid,
        actorName: actor.displayName || actor.uid,
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] equipment/[id]/storage/send POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
