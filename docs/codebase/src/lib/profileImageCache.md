# profileImageCache.ts

**File:** `src/lib/profileImageCache.ts`
**Status:** Active

## Purpose

localStorage cache for the user's resolved profile image download URL. Lets the avatar paint on first render before Firestore returns `enhancedUser.profileImage`, eliminating the icon → image flicker on reload. Stale-while-revalidate: the page seeds initial state from cache, then the `useEffect` overwrites once Firestore returns the authoritative value.

## Storage shape

| Key | Value |
|-----|-------|
| `profileImageCache:v1:{uid}` | Resolved download URL (http(s) only). Other schemes are rejected on read and write. |

The URL itself acts as the invalidation hash — uploads write a new Storage path that includes `Date.now()`, so any change in the Firestore field is a different string.

## Exports

| Export | Description |
|--------|-------------|
| `readProfileImageCache(uid)` | Returns the cached URL, or `undefined` if missing, non-http(s), uid missing, or storage unavailable. |
| `writeProfileImageCache(uid, url)` | Writes the URL if it is http(s); removes the entry otherwise. No-ops without a uid or on SSR. Swallows quota / disabled-storage errors. |
| `clearProfileImageCache(uid)` | Removes the cached entry. Called from `AuthContext.logout`. |

## Call sites

- `src/app/profile/page.tsx` — seeds `profileImageUrl` from cache; writes on `enhancedUser.profileImage` change and on upload.
- `src/app/settings/page.tsx` — same pattern.
- `src/contexts/AuthContext.tsx` — clears the entry inside `logout()` before `signOut`.

## Why not a hook

The cache is a thin wrapper around `window.localStorage`. State lives in each page; the cache is only consulted at mount and on `useEffect` runs. Wrapping it in a hook would only add ceremony.
