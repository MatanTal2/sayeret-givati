# PATCH /api/users/profile

**File:** `src/app/api/users/profile/route.ts`
**Status:** Active

## Purpose

Server-side write endpoint for a user's editable profile fields. Backed by `firebase-admin` via `serverUpdateUserProfile`. Triggers phone-book write-through when phone-book-relevant fields change.

## Request

```
PATCH /api/users/profile
Authorization: Bearer <idToken>
Body: { uid: string, updates: { teamId?: string, profileImage?: string } }
```

## Authorization

- Bearer token via `getActorOrError`.
- Caller may update their OWN profile (uid matches actor).
- ADMIN / SYSTEM_MANAGER may update any user's profile.

## Field allowlist

`PROFILE_WRITABLE_FIELDS` in `src/lib/db/server/userService.ts` is the single source of truth. Currently: `teamId`, `profileImage`. Unknown keys are silently dropped at the service layer.

## phoneNumber is rejected explicitly (400)

If the request body contains `updates.phoneNumber`, the route returns 400 immediately — BEFORE the actor check, intentionally — with a message pointing at the dedicated phone-change flow (`POST /api/users/phone-change/{initiate,confirm,cancel}`, shipped in Settings PR-C). Rationale: phone is an identity anchor and a profile-update PATCH must not be able to rewrite it without OTP re-verification + fresh password re-auth. The explicit 400 is loud-not-silent: a client that mistakenly includes `phoneNumber` learns immediately rather than seeing a 200 with no persisted change.

## Phone-book write-through

After a successful profile write, the route re-reads `users/{uid}` and calls `serverUpsertPhoneBookFromUser` whenever `teamId` or `profileImage` changed. The phone-book row is keyed by `militaryPersonalNumberHash` so it survives a future user→personnel relink.

## Failure modes

- 400 — missing `uid`, missing `updates` object, or `phoneNumber` present.
- 403 — caller is not the user and not elevated.
- 500 — Firestore failure during write or phone-book upsert.

## Related

- Council threat model + full PR-A → PR-C plan: `project_settings_page.md` in user memory.
