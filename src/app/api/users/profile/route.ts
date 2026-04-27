import { NextResponse } from 'next/server';
import { serverUpdateUserProfile } from '@/lib/db/server/userService';

/**
 * PATCH /api/users/profile
 * Body: { uid: string, updates: { teamId?, profileImage?, phoneNumber? } }
 *
 * Only whitelisted keys are accepted server-side; the caller's uid must match
 * the authenticated user (caller-side responsibility — we rely on the client
 * sending its own uid for now, matching the pattern of other API routes until
 * auth-bearer middleware lands).
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body?.uid || typeof body.uid !== 'string') {
      return NextResponse.json({ success: false, error: 'uid is required' }, { status: 400 });
    }
    if (!body?.updates || typeof body.updates !== 'object') {
      return NextResponse.json({ success: false, error: 'updates object is required' }, { status: 400 });
    }
    await serverUpdateUserProfile(body.uid, body.updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] users/profile PATCH failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
