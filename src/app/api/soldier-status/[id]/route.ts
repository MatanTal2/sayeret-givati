import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import {
  SoldierStatusValidationError,
  serverUpdateSoldierStatus,
} from '@/lib/db/server/soldierStatusService';
import type { SoldierStatus } from '@/types/soldierStatus';

interface PutBody {
  status?: unknown;
  customStatus?: unknown;
}

/**
 * PUT /api/soldier-status/[id]
 *
 * Bearer-gated. Any authenticated user can update a soldier's status. The id
 * in the URL is the soldier's militaryPersonalNumberHash (matches
 * authorized_personnel doc-id). The actor's uid is captured on the status
 * doc (`updatedBy`) and an audit row is appended to
 * `soldierStatus/{id}/history/{autoId}` — see `soldierStatusService` for
 * field shapes.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required in the path' },
        { status: 400 }
      );
    }

    const body = (await request.json()) as PutBody;
    if (typeof body.status !== 'string') {
      return NextResponse.json(
        { success: false, error: 'status is required' },
        { status: 400 }
      );
    }

    await serverUpdateSoldierStatus(
      id,
      {
        status: body.status as SoldierStatus,
        ...(typeof body.customStatus === 'string' ? { customStatus: body.customStatus } : {}),
      },
      { uid: actor.uid, displayName: actor.displayName },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SoldierStatusValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] soldier-status PUT failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
