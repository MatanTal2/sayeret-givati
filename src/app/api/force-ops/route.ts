import { NextResponse } from 'next/server';
import { serverForceOps } from '@/lib/db/server/forceOpsService';
import {
  validateActor,
  actorToAuthUser,
  fetchEquipmentForPolicy,
} from '@/lib/db/server/policyHelpers';
import { canForceTransfer } from '@/lib/equipmentPolicy';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const actor = validateActor(input.actor);
    const authUser = actorToAuthUser(actor);

    if (!Array.isArray(input.equipmentDocIds) || input.equipmentDocIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'equipmentDocIds must be a non-empty array' },
        { status: 400 }
      );
    }
    if (!['holder', 'signer', 'both'].includes(input.kind)) {
      return NextResponse.json(
        { success: false, error: 'kind must be one of: holder, signer, both' },
        { status: 400 }
      );
    }
    if (!input.targetUserId) {
      return NextResponse.json({ success: false, error: 'targetUserId is required' }, { status: 400 });
    }
    if (!input.reason) {
      return NextResponse.json({ success: false, error: 'reason is required' }, { status: 400 });
    }

    // Policy gate: actor must be allowed to force-transfer every targeted item.
    // TL can only force-transfer items in their team; manager+ anywhere.
    const equipmentList = await Promise.all(
      input.equipmentDocIds.map((id: string) => fetchEquipmentForPolicy(id))
    );
    for (const equipment of equipmentList) {
      if (!canForceTransfer({ user: authUser, equipment })) {
        return NextResponse.json(
          { success: false, error: `Forbidden for equipment ${equipment.id}` },
          { status: 403 }
        );
      }
    }

    const result = await serverForceOps({
      equipmentDocIds: input.equipmentDocIds,
      kind: input.kind,
      targetUserId: input.targetUserId,
      actorUserId: actor.uid,
      actorUserName: input.actorUserName || actor.displayName || actor.uid,
      reason: input.reason,
    });
    return NextResponse.json({ success: true, updatedDocIds: result.updatedDocIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] force-ops POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
