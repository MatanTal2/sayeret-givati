# firebase.ts

**File:** `src/lib/firebase.ts`
**Status:** Active

## Purpose

Firebase client SDK initialization. Initializes the Firebase app, Firestore database (with persistent IndexedDB cache in browsers), Firebase Auth, Storage, and App Check.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `app` (default) | `FirebaseApp` | Initialized Firebase app instance |
| `db` | `Firestore` | Firestore database instance — browser path is persistence-enabled |
| `auth` | `Auth` | Firebase Auth instance |
| `storage` | `FirebaseStorage` | Firebase Storage instance |

## Persistent Firestore cache (P1)

In browsers, `db` is built via `initializeFirestore` with:

- `persistentLocalCache({ tabManager: persistentSingleTabManager({ forceOwnership: false }) })`

Effects:
- Reads survive reloads — `getDoc` / `getDocs` / `onSnapshot` serve from IndexedDB while offline or before the network responds.
- Multi-tab safe. Only one tab owns writes; others read from the shared cache (`forceOwnership: false`).
- HMR-safe. A second initialization attempt on the same app falls back to `getFirestore(app)`.

In SSR / server contexts (`typeof window === 'undefined'`), `db` falls back to `getFirestore(app)` (memory cache only) so Node imports don't trip on the IndexedDB-only persistent cache.

Tradeoff: the IDB cache grows with read volume. Phase 7 introduces explicit invalidation hooks (S5 in `docs/spec/offline-first.md`) for permission/role revocation.

## Notes

- All client Firestore operations across the codebase use this `db` instance.
- All auth operations use this `auth` instance.
- Mock at `src/lib/__mocks__/firebase.ts` exposes `initializeFirestore`, `persistentLocalCache`, `persistentSingleTabManager` as no-op `jest.fn()` stubs.
- See `docs/spec/offline-first.md` Phase 1 for the migration context.
