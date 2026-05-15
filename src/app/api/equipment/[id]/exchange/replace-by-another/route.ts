import { NextResponse } from 'next/server';
import { serverReplaceByAnother } from '@/lib/db/server/exchangeRequestService';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';
import {
  actorToAuthUser,
  fetchEquipmentForPolicy,
} from '@/lib/db/server/policyHelpers';
import { canReplaceByAnother } from '@/lib/equipmentPolicy';

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
      const input = rawBody ? JSON.parse(rawBody) : {};
      if (!input.newSerialNumber || typeof input.newSerialNumber !== 'string' || !input.newSerialNumber.trim()) {
        return NextResponse.json({ success: false, error: 'newSerialNumber is required' }, { status: 400 });
      }

      const equipment = await fetchEquipmentForPolicy(id);
      const authUser = actorToAuthUser(actor);
      if (!canReplaceByAnother({ user: authUser, equipment })) {
        return NextResponse.json(
          { success: false, error: 'Only the signer of an available item may perform a direct replacement' },
          { status: 403 }
        );
      }

      const result = await serverReplaceByAnother({
        equipmentDocId: id,
        actorId: actor.uid,
        actorName: actor.displayName || actor.uid,
        newSerialNumber: input.newSerialNumber,
        reason: input.reason,
      });
      return NextResponse.json({
        success: true,
        newEquipmentDocId: result.newEquipmentDocId,
        requestId: result.requestId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] equipment/[id]/exchange/replace-by-another POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
