import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';
import { getAdminAuth, getAdminDb } from '@/lib/db/admin';
import { COLLECTIONS } from '@/lib/db/collections';
import { UserType } from '@/types/user';
import {
  serverConfirmPhoneChange,
  PhoneChangeNoPendingError,
  PhoneChangeNonceMismatchError,
  PhoneChangeTargetMismatchError,
  PhoneChangeProofMissingError,
  PhoneChangeAuthTooOldError,
} from '@/lib/db/server/phoneChangeService';
import { serverUpsertPhoneBookFromUser } from '@/lib/db/server/phoneBookService';
import { writeCredentialAuditEvent } from '@/lib/db/server/credentialAuditService';
import { hashPhoneE164 } from '@/lib/cryptoUtils';
import type { ConfirmRequest, ConfirmResponse } from '@/types/phoneChange';

/**
 * POST /api/users/phone-change/confirm
 * Body: { newPhoneE164: string, nonce: string }
 *
 * Commits a phone-change reservation after the client has completed
 * Firebase Auth `updatePhoneNumber`. The bearer idToken is the proof
 * carrier — its `phone_number` claim must match `newPhoneE164` and its
 * `auth_time` must be fresh enough to have post-dated the pending doc.
 *
 * On success: mirrors `users.phoneNumber`, reverse-syncs
 * `authorized_personnel`, stamps `users.sessionEpoch` to cut all other
 * devices on their next API hit, writes a `PHONE_CHANGED` audit row
 * (hashed numbers only), refreshes phoneBook, deletes the pending doc.
 *
 * Server-side retry: if the proof check fails on first attempt, we
 * re-verify the idToken after a 500ms sleep — Firebase's STS endpoint
 * can lag behind `updatePhoneNumber` by hundreds of milliseconds.
 *
 * `withIdempotency` wraps the handler so a replay of the same request
 * (same Idempotency-Key + same body) returns the cached response and
 * does NOT consume the OTP / mutate `users.sessionEpoch` twice.
 */
export async function POST(request: Request): Promise<NextResponse<ConfirmResponse>> {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) {
    return actorOrError as NextResponse<ConfirmResponse>;
  }
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const body = (rawBody ? JSON.parse(rawBody) : {}) as Partial<ConfirmRequest>;
      if (!body?.newPhoneE164 || typeof body.newPhoneE164 !== 'string') {
        return NextResponse.json(
          { success: false, error: 'newPhoneE164 is required' },
          { status: 400 },
        );
      }
      if (!body?.nonce || typeof body.nonce !== 'string') {
        return NextResponse.json(
          { success: false, error: 'nonce is required' },
          { status: 400 },
        );
      }

      // Re-verify the raw idToken so we can read the phone_number and
      // auth_time claims directly. `getActorOrError` validates the token but
      // strips the claims, so we re-call verifyIdToken to access them.
      const header = request.headers.get('authorization') ?? request.headers.get('Authorization') ?? '';
      const idToken = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';

      let { phone_number: tokenPhone, auth_time: authTimeSeconds } =
        await getAdminAuth().verifyIdToken(idToken, true);
      if (tokenPhone !== body.newPhoneE164) {
        await new Promise((r) => setTimeout(r, 500));
        const retry = await getAdminAuth().verifyIdToken(idToken, true);
        tokenPhone = retry.phone_number;
        authTimeSeconds = retry.auth_time;
      }

      const result = await serverConfirmPhoneChange({
        uid: actor.uid,
        newPhoneE164: body.newPhoneE164,
        nonce: body.nonce,
        tokenPhoneNumber: tokenPhone,
        tokenAuthTimeSeconds: authTimeSeconds ?? 0,
      });

      // Side-effects after the mirror commits. Failures here are logged but
      // do NOT roll back the mirror — the user's phone is already changed.
      try {
        const userSnap = await getAdminDb().collection(COLLECTIONS.USERS).doc(actor.uid).get();
        const u = userSnap.data() ?? {};
        await serverUpsertPhoneBookFromUser({
          uid: actor.uid,
          militaryPersonalNumberHash: u.militaryPersonalNumberHash as string,
          firstName: u.firstName as string | undefined,
          lastName: u.lastName as string | undefined,
          phoneNumber: result.newPhoneE164,
          email: u.email as string | undefined,
          teamId: u.teamId as string | undefined,
          userType: u.userType as UserType | undefined,
          photoURL: (u.profileImage as string | undefined) || (u.photoURL as string | undefined),
        });
      } catch (e) {
        console.warn('[phoneChange] phoneBook write-through failed:', e);
      }

      try {
        const xff = request.headers.get('x-forwarded-for') ?? '';
        const ip = xff.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;
        const userAgent = request.headers.get('user-agent') ?? undefined;
        await writeCredentialAuditEvent({
          uid: actor.uid,
          actorUid: actor.uid,
          actorUserType: String(actor.userType),
          eventType: 'PHONE_CHANGED',
          ip,
          userAgent,
          metadata: {
            newNumberHash: hashPhoneE164(result.newPhoneE164),
            ...(result.oldPhoneE164 ? { oldNumberHash: hashPhoneE164(result.oldPhoneE164) } : {}),
          },
        });
      } catch (e) {
        console.warn('[phoneChange] audit-log write failed:', e);
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof PhoneChangeNoPendingError) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'no_pending' },
          { status: 400 },
        );
      }
      if (error instanceof PhoneChangeNonceMismatchError) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'nonce_mismatch' },
          { status: 400 },
        );
      }
      if (error instanceof PhoneChangeTargetMismatchError) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'phone_mismatch' },
          { status: 400 },
        );
      }
      if (error instanceof PhoneChangeProofMissingError) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'phone_mismatch' },
          { status: 400 },
        );
      }
      if (error instanceof PhoneChangeAuthTooOldError) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'phone_mismatch' },
          { status: 400 },
        );
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] users/phone-change/confirm POST failed:', message);
      return NextResponse.json(
        { success: false, error: message, code: 'mirror_failed' },
        { status: 500 },
      );
    }
  }) as Promise<NextResponse<ConfirmResponse>>;
}
