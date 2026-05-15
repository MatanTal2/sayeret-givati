import { NextResponse } from 'next/server';
import { getActorOrError } from '@/lib/db/server/auth';
import { withIdempotency } from '@/lib/db/server/idempotency';
import {
  serverInitiatePhoneChange,
  PhoneChangeRateLimitError,
  PhoneChangePhoneInUseError,
} from '@/lib/db/server/phoneChangeService';
import type { InitiateRequest, InitiateResponse } from '@/types/phoneChange';

const E164_PATTERN = /^\+\d{8,15}$/;

/**
 * POST /api/users/phone-change/initiate
 * Body: { newPhoneE164: string }
 *
 * Reserves a phone-change slot for the authenticated user. Self-serve
 * only — admin-driven force resets go through a separate route (Q4=b,
 * not in this PR). Returns a server-issued nonce that the client must
 * echo back when it POSTs `/confirm` after completing
 * Firebase Auth `updatePhoneNumber`.
 */
export async function POST(request: Request): Promise<NextResponse<InitiateResponse>> {
  const actorOrError = await getActorOrError(request);
  if (actorOrError instanceof NextResponse) {
    return actorOrError as NextResponse<InitiateResponse>;
  }
  const actor = actorOrError;
  const rawBody = await request.text();

  return withIdempotency(request, actor, rawBody, async () => {
    try {
      const body = (rawBody ? JSON.parse(rawBody) : {}) as Partial<InitiateRequest>;
      if (!body?.newPhoneE164 || typeof body.newPhoneE164 !== 'string') {
        return NextResponse.json(
          { success: false, error: 'newPhoneE164 is required' },
          { status: 400 },
        );
      }
      if (!E164_PATTERN.test(body.newPhoneE164)) {
        return NextResponse.json(
          { success: false, error: 'newPhoneE164 must be E.164 format' },
          { status: 400 },
        );
      }

      const { nonce } = await serverInitiatePhoneChange({
        uid: actor.uid,
        actorUid: actor.uid,
        newPhoneE164: body.newPhoneE164,
      });

      return NextResponse.json({ success: true, nonce });
    } catch (error) {
      if (error instanceof PhoneChangeRateLimitError) {
        return NextResponse.json(
          { success: false, error: 'rate_limited' },
          { status: 429 },
        );
      }
      if (error instanceof PhoneChangePhoneInUseError) {
        return NextResponse.json(
          { success: false, error: 'same_number' },
          { status: 400 },
        );
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('[API] users/phone-change/initiate POST failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }) as Promise<NextResponse<InitiateResponse>>;
}
