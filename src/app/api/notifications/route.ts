import { NextResponse } from 'next/server';
import {
  serverCreateNotification,
  serverDeleteNotification,
} from '@/lib/db/server/notificationService';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';

export async function POST(request: Request) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const data = rawBody ? JSON.parse(rawBody) : {};
      if (!data.userId || !data.type || !data.title || !data.message) {
        return NextResponse.json(
          { success: false, error: 'userId, type, title, and message are required' },
          { status: 400 }
        );
      }
      const id = await serverCreateNotification(data);
      return NextResponse.json({ success: true, id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] notifications POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
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
      const { id } = rawBody ? JSON.parse(rawBody) : {};
      if (!id) {
        return NextResponse.json({ success: false, error: 'Notification id is required' }, { status: 400 });
      }
      await serverDeleteNotification(id);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] notifications DELETE failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
