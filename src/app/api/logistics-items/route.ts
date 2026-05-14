import { NextResponse } from 'next/server';
import {
  serverCreateLogisticsItem,
  serverUpdateLogisticsItem,
  serverDeleteLogisticsItem,
  validateLogisticsItemInput,
} from '@/lib/db/server/logisticsItemsService';
import { getActorOrError } from '@/lib/db/server/auth';
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
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const forbidden = requireTL(actorOrError.userType);
    if (forbidden) return forbidden;
    const body = await request.json();
    const input = validateLogisticsItemInput({ ...body, createdBy: actorOrError.uid });
    const id = await serverCreateLogisticsItem(input);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] logistics-items POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const forbidden = requireTL(actorOrError.userType);
    if (forbidden) return forbidden;
    const { id, ...updates } = await request.json();
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
}

export async function DELETE(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const forbidden = requireTL(actorOrError.userType);
    if (forbidden) return forbidden;
    const { id } = await request.json();
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
}
