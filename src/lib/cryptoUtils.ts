/**
 * Server-only crypto helpers. Imports `node:crypto` — must NOT be imported
 * from any client-bundled file. Keep usage confined to server-side service
 * code and API routes.
 */

import { createHash } from 'node:crypto';

/**
 * SHA-256 hash of an E.164 phone string. Used as audit-log metadata for
 * PHONE_CHANGED events so the credentialAuditLog never persists plaintext
 * numbers (privacy + IDF compliance posture).
 *
 * Hex lowercase output, 64 chars.
 */
export function hashPhoneE164(e164: string): string {
  return createHash('sha256').update(e164, 'utf8').digest('hex');
}

/**
 * Generate a cryptographically random opaque nonce. Used to bind a
 * phone-change initiate to its corresponding confirm so a leaked idToken
 * cannot stuff a different target number into an existing pending slot.
 *
 * 32 hex chars (16 random bytes).
 */
export function randomNonce(): string {
  const bytes = new Uint8Array(16);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { randomFillSync } = require('node:crypto') as typeof import('node:crypto');
  randomFillSync(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
