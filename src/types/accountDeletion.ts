/**
 * Account-deletion flow types (Settings PR-G).
 *
 * Soft-delete model: clicking "delete account" stamps `deletionRequestedAt`
 * on the user doc. The Firebase Auth user is NOT touched until hard-delete
 * (manual / cron, out of PR-G scope). Within the retention window the user
 * can cancel via `/cancel-delete` and resume normal access.
 */

import type { Timestamp } from 'firebase/firestore';

export const ACCOUNT_DELETION_RETENTION_DAYS = 30;

/** Fields appended to `users/{uid}` when a deletion is requested. */
export interface AccountDeletionFields {
  deletionRequestedAt: Timestamp;
  /** Optional free-text reason captured at request time. */
  deletionReason?: string;
}

/** Pre-flight outstanding-assets shape returned to the client when delete is blocked. */
export interface OutstandingAssets {
  equipmentCount: number;
  ammunitionUserHoldings: number;
  pendingTransferRequests: number;
}

export interface DeleteRequest {
  /** Optional free-text reason (max 500 chars). */
  reason?: string;
}

export interface DeleteResponse {
  success: boolean;
  error?: string;
  /** Stable client-side code for UX branching. */
  code?: 'has_outstanding_assets' | 'already_requested' | 'unauthorized' | 'unknown';
  outstanding?: OutstandingAssets;
}

export interface CancelDeleteResponse {
  success: boolean;
  error?: string;
  code?: 'no_pending_request' | 'unauthorized' | 'unknown';
}
