/**
 * Server-side phone-change service (Settings PR-C).
 *
 * Implements the two-phase pattern: initiate writes a pending reservation
 * doc with a server-issued nonce; confirm verifies the proof token claim,
 * commits the Firestore mirror, reverse-syncs `authorized_personnel`,
 * stamps a `sessionEpoch` fence on the user doc to cut other devices, and
 * deletes the pending doc.
 *
 * Failures inside the mirror batch leave the pending doc intact so the
 * caller can retry; the route surfaces this with `code: 'mirror_failed'`.
 */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '../admin';
import { COLLECTIONS } from '../collections';
import { randomNonce } from '@/lib/cryptoUtils';
import { serverWritePhoneToPersonnel } from './authorizedPersonnelService';
import type { PhoneChangePending } from '@/types/phoneChange';

const RATE_LIMIT_WINDOW_SECONDS = 60;

export class PhoneChangeRateLimitError extends Error {
  constructor() {
    super('initiate rate-limited');
    this.name = 'PhoneChangeRateLimitError';
  }
}

export class PhoneChangePhoneInUseError extends Error {
  constructor() {
    super('new phone matches current phone');
    this.name = 'PhoneChangePhoneInUseError';
  }
}

interface InitiateInput {
  uid: string;
  actorUid: string;
  newPhoneE164: string;
}

interface InitiateResult {
  nonce: string;
}

/**
 * Reserve a phone-change slot for `uid` targeting `newPhoneE164`. Returns
 * the server-issued nonce that the client must echo back on confirm.
 *
 * Enforces a 60s per-uid rate limit and a no-op early-return when the new
 * number equals the current number (saves SMS quota).
 *
 * Overwrites any existing pending doc for the same actor — never 409s a
 * self-call. (A different actor calling self-serve initiate against
 * another uid is already rejected at the route layer.)
 */
export async function serverInitiatePhoneChange(input: InitiateInput): Promise<InitiateResult> {
  const db = getAdminDb();

  const userSnap = await db.collection(COLLECTIONS.USERS).doc(input.uid).get();
  const currentPhone = (userSnap.data() ?? {}).phoneNumber as string | undefined;
  if (currentPhone && currentPhone === input.newPhoneE164) {
    throw new PhoneChangePhoneInUseError();
  }

  const rateLimitRef = db.collection(COLLECTIONS.PHONE_CHANGE_RATE_LIMIT).doc(input.uid);
  const rateSnap = await rateLimitRef.get();
  if (rateSnap.exists) {
    const last = rateSnap.data()?.lastInitiateAt as Timestamp | undefined;
    if (last) {
      const secondsAgo = (Date.now() - last.toMillis()) / 1000;
      if (secondsAgo < RATE_LIMIT_WINDOW_SECONDS) {
        throw new PhoneChangeRateLimitError();
      }
    }
  }

  const nonce = randomNonce();
  const pendingRef = db.collection(COLLECTIONS.PHONE_CHANGE_PENDING).doc(input.uid);
  await pendingRef.set({
    uid: input.uid,
    actorUid: input.actorUid,
    newPhoneE164: input.newPhoneE164,
    nonce,
    createdAt: FieldValue.serverTimestamp(),
  });
  await rateLimitRef.set({
    uid: input.uid,
    lastInitiateAt: FieldValue.serverTimestamp(),
  });

  return { nonce };
}

interface ConfirmInput {
  uid: string;
  newPhoneE164: string;
  nonce: string;
  /** Verified `phone_number` claim from the caller's fresh idToken. */
  tokenPhoneNumber: string | undefined;
  /** `auth_time` claim from the caller's fresh idToken (seconds since epoch). */
  tokenAuthTimeSeconds: number;
}

export interface ConfirmResult {
  oldPhoneE164: string | undefined;
  newPhoneE164: string;
  /** millisecond epoch we stamped on users.sessionEpoch — confirms the fence. */
  sessionEpochMs: number;
}

export class PhoneChangeNoPendingError extends Error {
  constructor() {
    super('no pending phone change');
    this.name = 'PhoneChangeNoPendingError';
  }
}
export class PhoneChangeNonceMismatchError extends Error {
  constructor() {
    super('pending nonce mismatch');
    this.name = 'PhoneChangeNonceMismatchError';
  }
}
export class PhoneChangeTargetMismatchError extends Error {
  constructor() {
    super('pending target phone mismatch');
    this.name = 'PhoneChangeTargetMismatchError';
  }
}
export class PhoneChangeProofMissingError extends Error {
  constructor() {
    super('idToken phone_number claim does not match newPhoneE164');
    this.name = 'PhoneChangeProofMissingError';
  }
}
export class PhoneChangeAuthTooOldError extends Error {
  constructor() {
    super('idToken auth_time is older than the pending reservation');
    this.name = 'PhoneChangeAuthTooOldError';
  }
}

/**
 * Atomically mirror a verified phone-change into Firestore.
 *
 * Validates: pending doc exists, nonce matches, target matches,
 * `tokenPhoneNumber === newPhoneE164` (cryptographic OTP proof), and
 * `tokenAuthTimeSeconds > pending.createdAt` (freshness fence — the
 * password re-auth that minted the token happened after the reservation).
 *
 * On success, batches: users mirror, authorized_personnel reverse-sync,
 * sessionEpoch stamp, pending delete. The personnel write goes outside
 * the batch (different doc shape, optional) but inside the same try.
 *
 * IDEMPOTENCY: if the pending doc is gone AND `users.phoneNumber` already
 * equals `newPhoneE164`, treat as a retry of an already-applied confirm
 * and return success without re-stamping the epoch. Callers can safely
 * retry on a transient network failure between confirm POST and 200.
 */
export async function serverConfirmPhoneChange(input: ConfirmInput): Promise<ConfirmResult> {
  const db = getAdminDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(input.uid);
  const pendingRef = db.collection(COLLECTIONS.PHONE_CHANGE_PENDING).doc(input.uid);

  const userSnap = await userRef.get();
  const userData = userSnap.data() ?? {};
  const currentPhone = userData.phoneNumber as string | undefined;
  const militaryIdHash = userData.militaryPersonalNumberHash as string | undefined;

  const pendingSnap = await pendingRef.get();

  // Idempotency window: pending already consumed, mirror already at target.
  if (!pendingSnap.exists && currentPhone === input.newPhoneE164) {
    return {
      oldPhoneE164: undefined,
      newPhoneE164: input.newPhoneE164,
      sessionEpochMs: (userData.sessionEpoch as number | undefined) ?? Date.now(),
    };
  }

  if (!pendingSnap.exists) throw new PhoneChangeNoPendingError();
  const pending = pendingSnap.data() as PhoneChangePending;
  if (pending.nonce !== input.nonce) throw new PhoneChangeNonceMismatchError();
  if (pending.newPhoneE164 !== input.newPhoneE164) throw new PhoneChangeTargetMismatchError();

  if (input.tokenPhoneNumber !== input.newPhoneE164) {
    throw new PhoneChangeProofMissingError();
  }

  const pendingCreatedAtMs = (pending.createdAt as unknown as Timestamp).toMillis();
  const authTimeMs = input.tokenAuthTimeSeconds * 1000;
  if (authTimeMs <= pendingCreatedAtMs) {
    throw new PhoneChangeAuthTooOldError();
  }

  const sessionEpochMs = authTimeMs;
  const batch = db.batch();
  batch.update(userRef, {
    phoneNumber: input.newPhoneE164,
    sessionEpoch: sessionEpochMs,
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.delete(pendingRef);
  await batch.commit();

  if (militaryIdHash) {
    try {
      await serverWritePhoneToPersonnel(militaryIdHash, input.newPhoneE164);
    } catch (e) {
      console.warn('[phoneChange] reverse-sync to authorized_personnel failed:', e);
    }
  }

  return {
    oldPhoneE164: currentPhone,
    newPhoneE164: input.newPhoneE164,
    sessionEpochMs,
  };
}

/**
 * Cancel a pending phone-change. Idempotent — no-op if no pending exists.
 * Used when the user closes the modal mid-flow or hits
 * auth/credential-already-in-use after a pending was written.
 */
export async function serverCancelPhoneChange(uid: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTIONS.PHONE_CHANGE_PENDING).doc(uid).delete().catch(() => {});
}
