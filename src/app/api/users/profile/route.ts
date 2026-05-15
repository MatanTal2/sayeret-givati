import { NextResponse } from 'next/server';
import { serverUpdateUserProfile, InvalidProfileUpdateError } from '@/lib/db/server/userService';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';
import type { ApiActor } from '@/lib/db/server/policyHelpers';
import { getAdminDb } from '@/lib/db/admin';
import { COLLECTIONS } from '@/lib/db/collections';
import { UserType } from '@/types/user';
import { serverUpsertPhoneBookFromUser } from '@/lib/db/server/phoneBookService';

/**
 * PATCH /api/users/profile
 * Body: { uid: string, updates: { teamId?, profileImage?, enlistmentCycle?, address?, communicationPreferences? } }
 *
 * Caller must be authenticated (bearer token). Only the user themselves, or
 * an ADMIN / SYSTEM_MANAGER, may update a profile.
 *
 * `phoneNumber` is explicitly rejected with 400 — phone changes MUST go
 * through the dedicated phone-change route (queued as Settings PR-C) that
 * requires fresh password re-auth + a Firebase Auth credential proof. See
 * `project_settings_page.md` Council synthesis for the threat model.
 */
export async function PATCH(request: Request) {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) return actorOrError;
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, () => handlePatch(actor, rawBody));
}

async function handlePatch(actor: ApiActor, rawBody: string): Promise<NextResponse> {
  try {
    const body = rawBody ? JSON.parse(rawBody) : {};
    if (!body?.uid || typeof body.uid !== 'string') {
      return NextResponse.json({ success: false, error: 'uid is required' }, { status: 400 });
    }
    if (!body?.updates || typeof body.updates !== 'object') {
      return NextResponse.json({ success: false, error: 'updates object is required' }, { status: 400 });
    }
    if ('phoneNumber' in body.updates) {
      return NextResponse.json(
        {
          success: false,
          error: 'phoneNumber cannot be updated via this endpoint — use the dedicated phone-change flow (Settings PR-C, not yet shipped). This guard prevents identity-anchor changes without OTP re-verification.',
        },
        { status: 400 }
      );
    }
    const isElevated =
      actor.userType === UserType.ADMIN || actor.userType === UserType.SYSTEM_MANAGER;
    if (body.uid !== actor.uid && !isElevated) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: cannot edit another user\'s profile' },
        { status: 403 }
      );
    }
    await serverUpdateUserProfile(body.uid, body.updates, actor.uid);

    // Write-through to phone book when phone-book-relevant fields change.
    // phoneNumber is excluded above; the phone-change route will trigger its
    // own write-through once landed.
    const touchesPhoneBook =
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
    if (error instanceof InvalidProfileUpdateError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] users/profile PATCH failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
