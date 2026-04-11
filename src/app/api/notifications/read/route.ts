import { NextResponse } from 'next/server';
import {
  serverMarkAsRead,
  serverMarkAllAsRead,
} from '@/lib/db/server/notificationService';

/**
 * PUT — Mark single notification as read
 */
export async function PUT(request: Request) {
  try {
    const { notificationId } = await request.json();
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
}

/**
 * POST — Mark all notifications as read for a user
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }
    await serverMarkAllAsRead(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] notifications/read POST failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
