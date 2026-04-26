import { NextResponse } from 'next/server';
import { serverCreateEquipmentBatch } from '@/lib/db/server/equipmentService';
import { validateActor, actorToAuthUser } from '@/lib/db/server/policyHelpers';
import { canAddEquipment } from '@/lib/equipmentPolicy';

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const actor = validateActor(input.actor);
    if (!canAddEquipment(actorToAuthUser(actor))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'items must be a non-empty array' },
        { status: 400 }
      );
    }
    const required = ['batchId', 'initialHolderName', 'initialHolderId', 'signedBy', 'signedById'];
    for (const key of required) {
      if (!input[key]) {
        return NextResponse.json(
          { success: false, error: `${key} is required` },
          { status: 400 }
        );
      }
    }

    const result = await serverCreateEquipmentBatch({
      items: input.items,
      batchId: input.batchId,
      initialHolderName: input.initialHolderName,
      initialHolderId: input.initialHolderId,
      signedBy: input.signedBy,
      signedById: input.signedById,
    });
    return NextResponse.json({ success: true, batchId: result.batchId, ids: result.ids });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] equipment/batch POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
