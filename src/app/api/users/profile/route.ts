import { NextResponse } from 'next/server';
import { serverUpdateUserProfile } from '@/lib/db/server/userService';
import { getActorOrError } from '@/lib/db/server/auth';
import { getAdminDb } from '@/lib/db/admin';
import { COLLECTIONS } from '@/lib/db/collections';
import { UserType } from '@/types/user';
import { serverUpsertPhoneBookFromUser } from '@/lib/db/server/phoneBookService';

/**
 * PATCH /api/users/profile
 * Body: { uid: string, updates: { teamId?, profileImage?, phoneNumber? } }
 *
 * Caller must be authenticated (bearer token). Only the user themselves, or
 * an ADMIN / SYSTEM_MANAGER, may update a profile.
 */
export async function PATCH(request: Request) {
  try {
    const actorOrError = await getActorOrError(request);
    if (actorOrError instanceof NextResponse) return actorOrError;
    const actor = actorOrError;
    const body = await request.json();
    if (!body?.uid || typeof body.uid !== 'string') {
      return NextResponse.json({ success: false, error: 'uid is required' }, { status: 400 });
    }
    if (!body?.updates || typeof body.updates !== 'object') {
      return NextResponse.json({ success: false, error: 'updates object is required' }, { status: 400 });
    }
    const isElevated =
      actor.userType === UserType.ADMIN || actor.userType === UserType.SYSTEM_MANAGER;
    if (body.uid !== actor.uid && !isElevated) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: cannot edit another user\'s profile' },
        { status: 403 }
      );
    }
    await serverUpdateUserProfile(body.uid, body.updates);

    // Write-through to phone book when phone-relevant fields change.
    const touchesPhoneBook =
      body.updates.phoneNumber !== undefined ||
      body.updates.teamId !== undefined ||
      body.updates.profileImage !== undefined;
    if (touchesPhoneBook) {
      const snap = await getAdminDb().collection(COLLECTIONS.USERS).doc(body.uid).get();
      if (snap.exists) {
        const u = snap.data() ?? {};
        await serverUpsertPhoneBookFromUser({
          uid: body.uid,
          militaryPersonalNumberHash: u.militaryPersonalNumberHash as string,
          firstName: u.firstName as string | undefined,
          lastName: u.lastName as string | undefined,
          phoneNumber: u.phoneNumber as string | undefined,
          email: u.email as string | undefined,
          teamId: u.teamId as string | undefined,
          userType: u.userType as UserType | undefined,
          photoURL: (u.profileImage as string | undefined) || (u.photoURL as string | undefined),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] users/profile PATCH failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
