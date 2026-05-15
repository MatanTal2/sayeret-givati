import { NextResponse } from 'next/server';
import {
  serverDeleteAmmunitionStock,
  serverDeleteSerialItem,
  serverReturnSerialItemToMgr,
  serverUpdateSerialItem,
} from '@/lib/db/server/ammunitionInventoryService';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';
import type { AmmunitionItemStatus, HolderType } from '@/types/ammunition';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const input = rawBody ? JSON.parse(rawBody) : {};

      if (input.kind !== 'item') {
        return NextResponse.json(
          { success: false, error: 'PUT only supports kind=item (SERIAL ammunition)' },
          { status: 400 }
        );
      }

      const payload = (input.payload || {}) as {
        newHolderType?: HolderType;
        newHolderId?: string;
        newStatus?: AmmunitionItemStatus;
      };

      await serverUpdateSerialItem({
        actor,
        serial: id,
        ...(payload.newHolderType ? { newHolderType: payload.newHolderType } : {}),
        ...(payload.newHolderId ? { newHolderId: payload.newHolderId } : {}),
        ...(payload.newStatus ? { newStatus: payload.newStatus } : {}),
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = /forbidden/i.test(message) ? 403 : 500;
      console.error('[API] ammunition-inventory PUT failed:', message);
      return NextResponse.json({ success: false, error: message }, { status });
    }
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const input = (rawBody ? JSON.parse(rawBody) : {}) as { action?: string };

      if (input.action !== 'return-to-mgr') {
        return NextResponse.json(
          { success: false, error: 'unsupported action' },
          { status: 400 }
        );
      }

      const result = await serverReturnSerialItemToMgr(actor, id);
      return NextResponse.json({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = /forbidden/i.test(message)
        ? 403
        : /not found/i.test(message)
          ? 404
          : 400;
      console.error('[API] ammunition-inventory PATCH failed:', message);
      return NextResponse.json({ success: false, error: message }, { status });
    }
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      let input: { kind?: string } = {};
      if (rawBody) {
        try { input = JSON.parse(rawBody); } catch { /* allow empty body */ }
      }

      if (input.kind === 'stock') {
        await serverDeleteAmmunitionStock({ actor, inventoryDocId: id });
        return NextResponse.json({ success: true });
      }
      if (input.kind === 'item') {
        await serverDeleteSerialItem(actor, id);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { success: false, error: 'kind must be stock or item' },
        { status: 400 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = /forbidden/i.test(message) ? 403 : 500;
      console.error('[API] ammunition-inventory DELETE failed:', message);
      return NextResponse.json({ success: false, error: message }, { status });
    }
  });
}
