/**
 * Profile image localStorage cache.
 *
 * Lets pages paint the user's avatar on first render before Firestore returns,
 * eliminating the icon → image flicker on reload. The Firestore profileImage
 * field acts as the authoritative source; this cache is stale-while-revalidate.
 *
 * Key shape: `profileImageCache:v1:{uid}` → resolved download URL.
 * Invalidation: any time enhancedUser.profileImage differs from the cached
 * value, overwrite. The download URL itself changes on every upload (path
 * includes `Date.now()`), so equality of the URL string is the hash.
 */

const STORAGE_PREFIX = 'profileImageCache:v1:';

function isUsable(url: string | undefined | null): url is string {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readProfileImageCache(uid: string | undefined): string | undefined {
  if (!uid || !storageAvailable()) return undefined;
  try {
    const cached = window.localStorage.getItem(STORAGE_PREFIX + uid);
    return isUsable(cached) ? cached : undefined;
  } catch {
    return undefined;
  }
}

export function writeProfileImageCache(uid: string | undefined, url: string | undefined): void {
  if (!uid || !storageAvailable()) return;
  try {
    if (isUsable(url)) {
      window.localStorage.setItem(STORAGE_PREFIX + uid, url);
    } else {
      window.localStorage.removeItem(STORAGE_PREFIX + uid);
    }
  } catch {
    // Quota exceeded or storage disabled — cache is best-effort.
  }
}

export function clearProfileImageCache(uid: string | undefined): void {
  if (!uid || !storageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + uid);
  } catch {
    // best-effort
  }
}
