import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import {
  GrantValidationError,
  serverRevokeGrant,
} from '@/lib/db/server/permissionGrantsService';

interface RevokeBody {
  reason?: unknown;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const { id } = await context.params;

    let body: RevokeBody = {};
    try {
      body = (await request.json()) as RevokeBody;
    } catch {
      // No body or invalid JSON → treat as empty
    }

    await serverRevokeGrant({
      grantId: id,
      actorUid: actor.uid,
      actorUserType: actor.userType,
      ...(actor.displayName ? { actorDisplayName: actor.displayName } : {}),
      ...(typeof body.reason === 'string' ? { reason: body.reason } : {}),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof GrantValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] permission-grants revoke failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
