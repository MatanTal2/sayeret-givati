import { NextResponse } from 'next/server';
import { serverRequestExchange } from '@/lib/db/server/exchangeRequestService';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';
import {
  actorToAuthUser,
  fetchEquipmentForPolicy,
} from '@/lib/db/server/policyHelpers';
import { canRequestExchange } from '@/lib/equipmentPolicy';

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
      if (!input.reason || typeof input.reason !== 'string' || !input.reason.trim()) {
        return NextResponse.json({ success: false, error: 'reason is required' }, { status: 400 });
      }

      const equipment = await fetchEquipmentForPolicy(id);
      const authUser = actorToAuthUser(actor);
      if (!canRequestExchange({ user: authUser, equipment })) {
        return NextResponse.json(
          { success: false, error: 'Only the current holder of an available item may request an exchange' },
          { status: 403 }
        );
      }

      const result = await serverRequestExchange({
        equipmentDocId: id,
        actorId: actor.uid,
        actorName: actor.displayName || actor.uid,
        reason: input.reason,
      });
      return NextResponse.json({ success: true, requestId: result.requestId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] equipment/[id]/exchange/request POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
