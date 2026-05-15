import { NextResponse } from 'next/server';
import {
  serverMarkAsRead,
  serverMarkAllAsRead,
} from '@/lib/db/server/notificationService';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';

/**
 * PUT — Mark single notification as read
 */
export async function PUT(request: Request) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const { notificationId } = rawBody ? JSON.parse(rawBody) : {};
      if (!notificationId) {
        return NextResponse.json({ success: false, error: 'notificationId is required' }, { status: 400 });
      }
      await serverMarkAsRead(notificationId);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] notifications/read PUT failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}

/**
 * POST — Mark all notifications as read for the authenticated user.
 */
export async function POST(request: Request) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      await serverMarkAllAsRead(actor.uid);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] notifications/read POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
