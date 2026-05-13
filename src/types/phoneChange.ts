/**
 * Phone-change flow types (Settings PR-C).
 *
 * Two-phase pattern: client initiates (server reserves), client performs
 * Firebase Auth `updatePhoneNumber`, client confirms (server mirrors).
 *
 * The pending doc is the reservation fence between the two server hits and
 * carries a server-issued nonce so a stolen idToken cannot replay a
 * different new-phone target against the same pending slot.
 */

import type { Timestamp } from 'firebase/firestore';

export interface PhoneChangePending {
  /** Target uid. Document ID equals this value. */
  uid: string;
  /** Staged new phone number in E.164. */
  newPhoneE164: string;
  /** Server-issued opaque nonce echoed back on confirm. */
  nonce: string;
  /** Server-stamped creation time. */
  createdAt: Timestamp;
  /** Actor who initiated the change. For self-serve === uid. */
  actorUid: string;
}

export interface InitiateRequest {
  newPhoneE164: string;
}

export interface InitiateResponse {
  success: boolean;
  nonce?: string;
  error?: string;
}

export interface ConfirmRequest {
  newPhoneE164: string;
  nonce: string;
}

export interface ConfirmResponse {
  success: boolean;
  error?: string;
  /** Server-side error code for client UX branching. */
  code?: 'mirror_failed' | 'phone_mismatch' | 'no_pending' | 'nonce_mismatch';
}

export interface CancelResponse {
  success: boolean;
  error?: string;
}

/** Rate-limit doc shape — separate collection keyed by uid. */
export interface PhoneChangeRateLimit {
  uid: string;
  lastInitiateAt: Timestamp;
}
