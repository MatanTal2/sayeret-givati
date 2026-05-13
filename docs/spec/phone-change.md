# Phone-change flow (Settings PR-C)

**Status:** Spec frozen 2026-05-13. Implementation in progress on `feat/settings-phone-change`.

Plugs the security hole closed by PR-A (profile route phone lockdown). Gives signed-in users a verified path to change their phone, and guarantees Firebase Auth ↔ Firestore consistency via a two-phase reservation pattern.

Out of scope: admin "force phone reset" — separate PR per Q4 (`/api/admin/force-phone-reset` with 4-eyes / dual-admin approval). Tracked in `project_settings_page.md`.

## Council answers (locked 2026-05-13)

| Q | Answer | Drives |
|---|--------|--------|
| Q1 | Reverse sync ON | After mirror, also update `authorized_personnel.phoneNumber` |
| Q2 | Defer uniqueness | No transactional uniqueness check, no `phoneNumbers/{e164}` index doc |
| Q3 | Password re-auth + OTP new phone | Two-step client flow; old phone not re-verified |
| Q4 | Dedicated admin endpoint (separate PR) | Out of PR-C scope |
| Q5 | 1y retention | `credentialAuditLog` TTL = 1y; cleanup is a follow-up PR |
| Q6 | Two-phase Firestore-first | Pending-reservation doc before Auth update; rollback on Firestore mirror failure |

## User flow (client)

```
Settings → "שנה מספר טלפון"
  ↓
[Modal step 1: re-auth]
  Current password input → reauthenticateWithCredential(EmailAuth.credential(email, pwd))
  ↓
[Modal step 2: phone entry]
  New phone (E.164) → invisible reCAPTCHA → PhoneAuthProvider.verifyPhoneNumber(e164, verifier)
  → SMS sent → returns verificationId
  ↓
[Modal step 3: OTP entry]
  6-digit code → PhoneAuthProvider.credential(verificationId, code) → AuthCredential
  ↓
[Server initiate]
  POST /api/users/phone-change/initiate { newPhoneE164 }
  → server writes phoneChangePending/{uid} doc, returns 200
  ↓
[Client: Auth update]
  updatePhoneNumber(currentUser, credential)
  → Firebase Auth phone now updated
  → user.reload() + user.getIdToken(true)
  ↓
[Server confirm]
  POST /api/users/phone-change/confirm { newPhoneE164 }
  → server validates fresh idToken claim phone_number === newPhoneE164
  → mirrors users.phoneNumber = newPhoneE164
  → reverse-syncs authorized_personnel.phoneNumber (Q1=a)
  → writes phoneBook via existing serverUpsertPhoneBookFromUser
  → writes credentialAuditLog PHONE_CHANGED with { oldNumberHash, newNumberHash }
  → revokes refresh tokens (forces re-login on other devices)
  → deletes phoneChangePending/{uid}
  ↓
[Client: success toast → modal closes]
  Local AuthContext refreshes enhancedUser from Firestore.
  Note: refresh-token revocation will sign user out on next idToken refresh (~1 hour),
  not immediately. User stays logged in this session. Document this in tooltip.
```

### Error surfaces (client)

- `auth/wrong-password` / `auth/invalid-credential` on re-auth → existing `WRONG_PASSWORD` text
- `auth/requires-recent-login` → `RequiresRecentLoginError` → instruct user to log out + log in
- `auth/invalid-phone-number` → existing `OTP_INVALID_PHONE_FORMAT` text
- `auth/code-expired` / `auth/invalid-verification-code` → existing `OTP_WRONG_CODE` text
- `auth/credential-already-in-use` → new text `PHONE_ALREADY_LINKED` ("מספר הטלפון כבר משויך לחשבון אחר") — distinct from `EMAIL_ALREADY_LINKED` which currently swallows this case
- Server initiate/confirm 4xx/5xx → surface server `error` field; on 409 (stale pending) auto-retry by deleting + re-initiating

## Server flow (two-phase pattern)

Q6=c — never commit Auth without a Firestore mirror. Pending-reservation doc fences out split-brain.

### Phase 1 — `POST /api/users/phone-change/initiate`

1. Authenticate caller via bearer token (`getActorOrError`).
2. Validate body: `{ newPhoneE164: string }`. E.164 format check (`^\+\d{8,15}$`).
3. Reject if `actor.uid !== body.uid` AND not elevated. PR-C is self-serve only — admin path is the separate PR.
4. Check `phoneChangePending/{uid}` does NOT already exist; if it does and is fresh (< 5min), 409. If stale (> 5min), overwrite.
5. Write `phoneChangePending/{uid}`:
   ```ts
   {
     uid: string,            // doc ID = uid
     newPhoneE164: string,   // staged value
     createdAt: serverTs,
     actorUid: string,       // === uid (admin path is separate)
   }
   ```
6. Return 200 `{ success: true }`.

Notes:
- Pending doc has NO TTL by default. Stale ones are overwritten on next initiate, cleaned on confirm, and a separate cron (out of scope) could purge > 24h pendings.
- No SMS rate limit yet (Q5/Council "should-have"). Tracked as follow-up: rate-limit `(actorUid, destinationPhone, ip)` server-side.

### Phase 2 — `POST /api/users/phone-change/confirm`

1. Authenticate caller via bearer token. **Refresh the idToken claim before reading it** — caller should have called `getIdToken(true)` after `updatePhoneNumber`. Server reads `decodedToken.phone_number` directly from the verified token claim.
2. Validate body: `{ newPhoneE164: string }`.
3. Load `phoneChangePending/{actor.uid}`:
   - If missing → 400 "no pending phone change for this user".
   - If `pending.newPhoneE164 !== body.newPhoneE164` → 400 "phone mismatch with pending reservation".
4. **Proof check:** `decodedToken.phone_number === body.newPhoneE164`. If not, the client never actually completed Firebase `updatePhoneNumber` — reject 400. This is the cryptographic anchor that proves OTP verification happened.
5. Read current `users/{uid}.phoneNumber` for `oldPhoneE164` (used for audit hash).
6. **Atomic batched write:**
   - `users/{uid}` → `{ phoneNumber: newPhoneE164, updatedAt: serverTs }`
   - `authorized_personnel/{militaryPersonalNumberHash}` → `{ phoneNumber: newPhoneE164 }` (Q1=a reverse sync). Look up hash via `users/{uid}.militaryPersonalNumberHash`.
   - Delete `phoneChangePending/{uid}`.
7. After batch commits successfully:
   - `serverUpsertPhoneBookFromUser(...)` to refresh phone-book entry (uses existing helper).
   - `writeCredentialAuditEvent({ uid, actorUid, actorUserType, eventType: 'PHONE_CHANGED', metadata: { oldNumberHash: sha256(oldPhone), newNumberHash: sha256(newPhone) } })` — hashes never plaintext.
   - `getAdminAuth().revokeRefreshTokens(uid)` — invalidates all other sessions on next token refresh.
8. **Rollback path:** if batched write fails AND Firebase Auth has already been updated client-side, the user lands in a state where Auth phone ≠ Firestore phone. Server returns 500 with `code: 'mirror_failed'`. Client must:
   - Re-fetch profile (Firestore wins per Q6=c — display old phone).
   - Surface "phone change failed — try again". Pending doc is left intact for next attempt.
   - A reconciler (manual or cron, out of scope) compares `auth.users[*].phoneNumber` vs `firestore.users[*].phoneNumber` and re-applies Firestore on drift. Tracked in follow-ups.

Note: Q6=c said "Firestore-first reservation". Doing a true Firestore-write-before-Auth-update is impossible here because Firebase phone update REQUIRES client SDK and a verified credential (admin SDK `updateUser` bypasses verification). The pending-doc is the reservation; the post-Auth confirm step is the canonical mirror. Drift window = milliseconds between Auth update and confirm POST landing.

## Reverse sync (Q1=a)

User-driven phone change writes to BOTH `users` and `authorized_personnel`. Today only `personnel → user` sync exists (`serverSyncPersonnelToUser`). PR-C adds the reverse leg, scoped narrowly to the phone field:

- New helper `serverWritePhoneToPersonnel(militaryPersonalNumberHash, e164)` in `authorizedPersonnelService.ts`.
- Single field update. No status / role / name propagation.
- If the personnel doc doesn't exist, log + continue (don't block the user's own profile update).

## Audit (Q5=a, 1y retention)

PHONE_CHANGED entries land in `credentialAuditLog` with `{ oldNumberHash, newNumberHash }` metadata. Plaintext numbers NEVER stored.

`oldNumberHash` / `newNumberHash` = SHA-256 of the E.164 string. New helper `hashPhoneE164(e164)` in `src/lib/cryptoUtils.ts` (or extend existing if present).

Retention: 1y. NOT enforced in PR-C — Firestore TTL policy or cron job is a follow-up. PR-C only stamps the entries with the standard `timestamp` field; cleanup job will purge `timestamp < now - 365d`.

## Refresh-token revocation + old-phone notification

- `revokeRefreshTokens(uid)` is called server-side after the mirror succeeds. Effect: other devices get a fresh idToken on next refresh attempt that's invalidated; user is forced to re-login on those devices. Current session continues using its in-memory idToken until expiry (~1h).
- Old-phone SMS notification: NOT in PR-C. No transactional SMS channel exists in the codebase (Twilio was removed during the Firebase Phone Auth migration). Tracked as follow-up — depends on the email/SMS sender pick that lands in PR-E. `updatePhoneNumber` itself triggers zero Firebase notifications (no built-in email or SMS — do not assume one fires).

## Files affected

### New
- `src/app/api/users/phone-change/initiate/route.ts`
- `src/app/api/users/phone-change/confirm/route.ts`
- `src/components/settings/ChangePhoneModal.tsx`
- `src/lib/db/server/phoneChangeService.ts` — pending reservation + atomic mirror
- `src/types/phoneChange.ts` — `PhoneChangePending`, initiate/confirm request/response types
- `src/lib/cryptoUtils.ts` (or extend if exists) — `hashPhoneE164(e164: string): string`
- `docs/codebase/src/app/api/users/phone-change/initiate/route.md`
- `docs/codebase/src/app/api/users/phone-change/confirm/route.md`
- `docs/codebase/src/components/settings/ChangePhoneModal.md`
- `docs/codebase/src/lib/db/server/phoneChangeService.md`

### Modified
- `src/app/settings/page.tsx` — enable previously-disabled "שנה מספר טלפון" button, open new modal
- `src/lib/firebasePhoneAuth.ts` — extend with three helpers: `reauthEmailPassword(currentPassword)`, `verifyNewPhone(e164)` (wraps `PhoneAuthProvider.verifyPhoneNumber`), `applyVerifiedPhoneCredential(verificationId, code)` (wraps `updatePhoneNumber`)
- `src/lib/firebasePhoneAuth.ts` `mapFirebaseAuthError` — split `auth/credential-already-in-use` to its own `PHONE_ALREADY_LINKED` key
- `src/lib/db/server/authorizedPersonnelService.ts` — new `serverWritePhoneToPersonnel(hash, e164)` helper
- `src/lib/db/collections.ts` — add `PHONE_CHANGE_PENDING: 'phoneChangePending'`
- `src/constants/text.ts` + `src/constants/text.en.ts` — bilingual additions (modal labels, errors, success toasts, button)
- `firebase/firestore.rules` — deny client read/write on `phoneChangePending/{id}` (server-only)
- `src/lib/__mocks__/firebase.ts` — add stubs for `PhoneAuthProvider.verifyPhoneNumber`, `PhoneAuthProvider.credential`, `updatePhoneNumber`, `reauthenticateWithCredential` (most exist), `revokeRefreshTokens` (admin mock)
- `docs/codebase/src/app/api/users/profile/route.md` — update "phoneNumber rejected → use phone-change route" pointer to new live route paths

### Tests
- `src/lib/__tests__/firebasePhoneAuth.test.ts` — extend with the three new helpers (happy + failure cases)
- `src/lib/db/server/__tests__/phoneChangeService.test.ts` — initiate, confirm-happy, mismatch, missing-pending, mirror-failure rollback signaling

## Implementation order

Stacked commits inside the PR for review clarity:

1. **Foundation:** types, collection const, hashPhoneE164, rules, mock extensions.
2. **Server service + initiate route:** `phoneChangeService.ts` (pending write) + `initiate/route.ts`.
3. **Server confirm route + reverse sync:** `confirm/route.ts` + personnel write helper + audit + revoke.
4. **Client helpers:** `firebasePhoneAuth.ts` extensions + error mapper split.
5. **Client modal:** `ChangePhoneModal.tsx` + settings page wire-up + text constants.
6. **Tests:** all suites.
7. **Docs:** all `docs/codebase/` files + this spec finalized + `project_settings_page.md` memory update.

## Follow-ups (out of PR-C)

- Rate-limit OTP sends keyed on `(actorUid, destinationPhone, ip)`. (Council "should-have".)
- `phoneChangePending` cron purge for stale > 24h reservations.
- `credentialAuditLog` 1y TTL purge job (Q5=a).
- Old-phone notification (email + SMS) — depends on PR-E notification sender pick.
- Auth↔Firestore phone reconciler cron.
- `auth/credential-already-in-use` → "phone already linked" UX with sign-in offer.
- Admin force-phone-reset endpoint (Q4=b separate PR with 4-eyes).
- App Check + reCAPTCHA Enterprise initialization (not present in codebase yet — Council "should-have").
- `cachedVerifier` reset on Settings-page mount (Council polish).
