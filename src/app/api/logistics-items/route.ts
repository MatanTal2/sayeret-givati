import { NextResponse } from 'next/server';
import {
  serverCreateLogisticsItem,
  serverUpdateLogisticsItem,
  serverDeleteLogisticsItem,
  validateLogisticsItemInput,
} from '@/lib/db/server/logisticsItemsService';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';
import { UserType } from '@/types/user';

function requireTL(userType: UserType): NextResponse | null {
  const ok =
    userType === UserType.ADMIN ||
    userType === UserType.SYSTEM_MANAGER ||
    userType === UserType.MANAGER ||
    userType === UserType.TEAM_LEADER;
  if (ok) return null;
  return NextResponse.json(
    { success: false, error: 'Forbidden: only team-leader+ may modify logistics items' },
    { status: 403 }
  );
}

export async function POST(request: Request) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const forbidden = requireTL(actor.userType);
      if (forbidden) return forbidden;
      const body = rawBody ? JSON.parse(rawBody) : {};
      const input = validateLogisticsItemInput({ ...body, createdBy: actor.uid });
      const id = await serverCreateLogisticsItem(input);
      return NextResponse.json({ success: true, id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] logistics-items POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
  });
}

export async function PUT(request: Request) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const forbidden = requireTL(actor.userType);
      if (forbidden) return forbidden;
      const { id, ...updates } = rawBody ? JSON.parse(rawBody) : {};
      if (!id || typeof id !== 'string') {
        return NextResponse.json({ success: false, error: 'Item id is required' }, { status: 400 });
      }
      await serverUpdateLogisticsItem(id, updates);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] logistics-items PUT failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
  });
}

export async function DELETE(request: Request) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const forbidden = requireTL(actor.userType);
      if (forbidden) return forbidden;
      const { id } = rawBody ? JSON.parse(rawBody) : {};
      if (!id || typeof id !== 'string') {
        return NextResponse.json({ success: false, error: 'Item id is required' }, { status: 400 });
      }
      await serverDeleteLogisticsItem(id);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] logistics-items DELETE failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
