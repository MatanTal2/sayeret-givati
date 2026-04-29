/**
 * SessionStorage flag indicating that the user is actively progressing through
 * the registration flow. While set, AuthContext must NOT treat a Firebase Auth
 * user with no Firestore profile as an orphan to sign out — registration is
 * legitimately in that intermediate state until /api/auth/register completes.
 *
 * Cleared as soon as registration succeeds or the modal cleans up.
 */
const KEY = 'registrationInProgress';

export function setRegistrationInProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(KEY, '1');
  } catch {
    // sessionStorage unavailable (private mode, SSR) — best-effort.
  }
}

export function clearRegistrationInProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // best-effort
  }
}

export function isRegistrationInProgress(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
