import { NextResponse } from 'next/server';
import { serverCreateReportRequest } from '@/lib/db/server/reportRequestService';
import { actorToAuthUser } from '@/lib/db/server/policyHelpers';
import { getActorOrError } from '@/lib/db/server/auth';
import { isManagerOrAbove } from '@/lib/equipmentPolicy';

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const input = await request.json();

    // Only managers/admins can create report requests.
    if (!isManagerOrAbove(actorToAuthUser(actor))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden — manager+ only' },
        { status: 403 }
      );
    }

    if (!input.scope) {
      return NextResponse.json(
        { success: false, error: 'scope is required' },
        { status: 400 }
      );
    }
    const targetUserIds = Array.isArray(input.targetUserIds) ? input.targetUserIds : [];
    // For 'user' / 'items' scopes the client must materialize target user IDs.
    // For 'team' / 'all' scopes the server resolves the user list when the array is empty.
    if (
      (input.scope === 'user' || input.scope === 'items') &&
      targetUserIds.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'targetUserIds required for scope=user|items' },
        { status: 400 }
      );
    }

    const result = await serverCreateReportRequest({
      scope: input.scope,
      targetUserIds,
      targetEquipmentDocIds: input.targetEquipmentDocIds,
      targetTeamId: input.targetTeamId,
      requestedByUserId: actor.uid,
      requestedByUserName: input.requestedByUserName || actor.displayName || actor.uid,
      note: input.note,
      expiresAtMs: input.expiresAtMs,
    });
    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] report-requests POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
