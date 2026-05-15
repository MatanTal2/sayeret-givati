# Offline-First Threat Model

**Status:** Active. Companion to `docs/spec/offline-first.md` Phase 5.
**Locked decisions:** S1 (`_idempotency` snapshot policy), S10 (no app-layer queue encryption).

## Scope

This document covers the security posture of the offline outbox (`src/lib/offline/outbox.ts`), the replay loop (`src/lib/offline/replay.ts`), and the server-side idempotency layer (`src/lib/db/server/idempotency.ts`).

## Assets

1. **Queue payloads in IndexedDB** — mutation request bodies pending replay. May contain equipment moves, status updates, OTP-bound flows (queue-eligible only after the OTP step). Readable plaintext under the user's OS account.
2. **Idempotency keys (UUIDs)** — opaque tokens. Possession does not grant authority; the server still requires a valid bearer token.
3. **`_idempotency/{uid}_{key}` records** — server-side sync tokens. Contain a request fingerprint and a small response snapshot. Admin SDK only; clients are denied by Firestore rules.

## Threats

### T1. Lost / stolen device with unlocked OS
**Risk:** Queue payloads are readable plaintext. Attacker with shell-level access can inspect what the user was about to send.
**Decision:** Accepted (S10). Mitigation is **policy, not code** — IDF-issued devices ship with:
- Mandatory passcode + biometric unlock.
- Short screen-lock timeout (≤5 minutes).
- Full-disk encryption enabled.
- Remote-wipe enrollment.

Device passcode + FDE is a deployment prerequisite. The threat model intentionally does not wrap queue bodies in subtle-crypto AES-GCM. The orphaned-data failure mode (in-memory key lost on app close, session expiry mid-field, dead-zone reconnect, crashed tab) is operationally worse than the localized stolen-device risk. The device is the secure boundary.

### T2. Shared device with sign-out
**Risk:** User A signs out, user B signs in; B's replay drains A's queue.
**Mitigation:** Queue entries are tagged with the originating UID (`OutboxEntry.uid`). Replay loop reads `auth.currentUser.uid` and only drains entries for that UID. Sign-in by a different UID surfaces nothing of A's. If A signs back in later, A's queue resumes.

### T3. XSS reading or tampering with the queue
**Risk:** Cross-site-script inside the app could read pending entries (revealing equipment IDs, status text) or enqueue spurious mutations.
**Mitigation:**
- Standard CSP and dependency hygiene (no `dangerouslySetInnerHTML` outside vetted Markdown rendering paths).
- Mutations require a valid Firebase ID token at replay time; XSS-enqueued fake entries are rejected by server auth.
- IndexedDB is same-origin; no cross-origin disclosure.

This is the same surface as XSS-stealing the current token, which already exists pre-offline. No new bypass introduced.

### T4. Replay of a captured Idempotency-Key
**Risk:** Network attacker captures `Idempotency-Key: K` from one of the user's requests and replays it.
**Mitigation:** Replay needs a valid bearer token. Without it, server returns 401. With a valid token (i.e. the attacker compromised the user's session — out of scope), the server returns the cached snapshot from `_idempotency/{uid}_K`, which is the same state the legitimate user already saw. No write occurs.

### T5. Idempotency-Key reuse with different payload
**Risk:** Bug or malicious client sends `Idempotency-Key: K` first with body A, then later with body B.
**Mitigation:** `withIdempotency` fingerprints the request (`SHA256(method|path|SHA256(body))`) and stores it on the record. Mismatch on subsequent attempts → `422 IDEMPOTENCY_KEY_REUSED`. No write, no cached-snapshot disclosure. Audit M2.

### T6. Stale-pending lock theft
**Risk:** Caller A acquires the idempotency lock, crashes before committing the snapshot. Caller B (or A on retry) sees `status:'pending'` forever and queues poll forever.
**Mitigation:** After 30 s, a pending lock is considered stale. The contender deletes it and reattempts. The window is bounded; locks cannot be camped indefinitely.

### T7. Persistent Firestore cache disclosure
**Risk:** The Phase 1 `persistentLocalCache` stores read results (equipment lists, user profiles) in IndexedDB. Same lost-device threat as T1.
**Mitigation:** Same as T1 — accepted, mitigated by device policy. The cache contains nothing the user couldn't already see with their account.

### T8. Cached snapshot in `_idempotency` leak
**Risk:** If clients could read `_idempotency`, they would see another user's response snapshots.
**Mitigation:** `firebase/firestore.rules` denies all client access to `_idempotency`. The collection is server-only (`firebase-admin`). Verified per-deploy via `firebase deploy --only firestore:rules`.

### T9. Permission revocation lag
**Risk:** User's role is revoked server-side; client cache (Phase 1) and SW shell (Phase 3) still serve stale authorized content for some time.
**Mitigation (Phase 7 — S5):** on auth state change OR detected `403/401` on any read, the client wipes the Firestore persistent cache (`clearIndexedDbPersistence`) and SW runtime caches for `/api`. Server can also push `X-Cache-Invalidate: <scope>` headers on permission-mutation responses for proactive invalidation.

## Out of scope

- Adversarial replay attacks at the network layer (TLS handles this).
- Compromise of the Firebase service account credential (separate ops concern; rotation policy in `docs/codebase/firebase-admin.md`).
- DOS via filling IndexedDB. Phase 8 will cap queue depth and surface a stuck-queue warning.

## Audit trail

| Item | Phase | Where it lives |
|------|-------|----------------|
| S1 — snapshot policy | P4 | `docs/codebase/idempotency.md`, `src/lib/db/server/idempotency.ts` |
| S10 — no app-layer encryption | P5 | this doc |
| T2 — UID-tagged queue | P5 | `src/lib/offline/outbox.ts`, `src/lib/offline/replay.ts` |
| T8 — _idempotency rules | P4 | `firebase/firestore.rules` |
| T9 — cache invalidation | P7 | (queued) |
