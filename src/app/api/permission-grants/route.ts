import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import {
  GrantValidationError,
  isGrantIssuer,
  serverIssueGrant,
  serverListGrants,
} from '@/lib/db/server/permissionGrantsService';
import { GrantStatus } from '@/types/permissionGrant';
import { UserType } from '@/types/user';

export async function GET(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    if (!isGrantIssuer(actor.userType)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only admin or system manager may list grants' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const includeExpired = searchParams.get('includeExpired') === 'true';

    const grants = await serverListGrants({
      ...(userId ? { userId } : {}),
      ...(status === GrantStatus.ACTIVE || status === GrantStatus.REVOKED
        ? { status }
        : {}),
      includeExpired,
    });

    return NextResponse.json({ success: true, grants });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] permission-grants GET failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

interface CreateBody {
  userId?: unknown;
  userDisplayName?: unknown;
  grantedRole?: unknown;
  scope?: unknown;
  scopeTeamId?: unknown;
  durationMs?: unknown;
  expiresAtMs?: unknown;
  reason?: unknown;
}

export async function POST(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;

    const body = (await request.json()) as CreateBody;

    if (typeof body.userId !== 'string' || !body.userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }
    if (typeof body.grantedRole !== 'string') {
      return NextResponse.json(
        { success: false, error: 'grantedRole is required' },
        { status: 400 }
      );
    }
    if (body.scope !== 'all' && body.scope !== 'team') {
      return NextResponse.json(
        { success: false, error: "scope must be 'all' or 'team'" },
        { status: 400 }
      );
    }
    if (typeof body.reason !== 'string') {
      return NextResponse.json(
        { success: false, error: 'reason is required' },
        { status: 400 }
      );
    }

    let expiresAtMs: number;
    if (typeof body.expiresAtMs === 'number') {
      expiresAtMs = body.expiresAtMs;
    } else if (typeof body.durationMs === 'number') {
      expiresAtMs = Date.now() + body.durationMs;
    } else {
      return NextResponse.json(
        { success: false, error: 'durationMs or expiresAtMs is required' },
        { status: 400 }
      );
    }

    const result = await serverIssueGrant({
      userId: body.userId,
      ...(typeof body.userDisplayName === 'string' && body.userDisplayName
        ? { userDisplayName: body.userDisplayName }
        : {}),
      grantedRole: body.grantedRole as UserType,
      scope: body.scope,
      ...(body.scope === 'team' && typeof body.scopeTeamId === 'string'
        ? { scopeTeamId: body.scopeTeamId }
        : {}),
      expiresAtMs,
      reason: body.reason,
      issuerUid: actor.uid,
      issuerUserType: actor.userType,
      ...(actor.displayName ? { issuerDisplayName: actor.displayName } : {}),
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    if (error instanceof GrantValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] permission-grants POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
