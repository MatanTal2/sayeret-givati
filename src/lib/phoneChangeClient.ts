/**
 * Client wrapper for the phone-change API. Three calls:
 *   initiatePhoneChange(newPhoneE164)  → returns the server-issued nonce.
 *   confirmPhoneChange(newPhoneE164, nonce) → server mirrors + audit.
 *   cancelPhoneChange() → drops orphan pending doc.
 *
 * The client orchestration (re-auth → reCAPTCHA → verifyPhoneNumber →
 * OTP → updatePhoneNumber → confirm) lives in `ChangePhoneModal.tsx`.
 * This file is the thin HTTP layer.
 */
import { apiFetch } from '@/lib/apiFetch';

export interface InitiateResult {
  success: boolean;
  nonce?: string;
  /** Stable client-side code so the UI can branch without parsing the message. */
  code?: 'rate_limited' | 'same_number' | 'invalid_input' | 'unauthorized' | 'unknown';
}

export interface ConfirmResult {
  success: boolean;
  code?: 'mirror_failed' | 'phone_mismatch' | 'no_pending' | 'nonce_mismatch' | 'unauthorized' | 'unknown';
}

export async function initiatePhoneChange(newPhoneE164: string): Promise<InitiateResult> {
  const res = await apiFetch('/api/users/phone-change/initiate', {
    method: 'POST',
    body: JSON.stringify({ newPhoneE164 }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data?.success) return { success: true, nonce: data.nonce };
  if (res.status === 429) return { success: false, code: 'rate_limited' };
  if (res.status === 401 || res.status === 403) return { success: false, code: 'unauthorized' };
  if (res.status === 400 && data?.error === 'same_number') return { success: false, code: 'same_number' };
  if (res.status === 400) return { success: false, code: 'invalid_input' };
  return { success: false, code: 'unknown' };
}

export async function confirmPhoneChange(newPhoneE164: string, nonce: string): Promise<ConfirmResult> {
  const res = await apiFetch('/api/users/phone-change/confirm', {
    method: 'POST',
    body: JSON.stringify({ newPhoneE164, nonce }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data?.success) return { success: true };
  if (res.status === 401 || res.status === 403) return { success: false, code: 'unauthorized' };
  if (data?.code) return { success: false, code: data.code };
  return { success: false, code: 'unknown' };
}

/**
 * Best-effort cancel. Errors are swallowed — orphan pending docs aren't
 * worth blocking the user on a network hiccup; the server-side rate
 * limit eventually times out and overwrites stale reservations.
 */
export async function cancelPhoneChange(): Promise<void> {
  try {
    await apiFetch('/api/users/phone-change/cancel', { method: 'POST' });
  } catch (e) {
    console.warn('[phoneChange] cancel failed:', e);
  }
}
