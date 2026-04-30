# Phone Book — Phase 1

Live spec for the `/phone-book` directory. Phase 1 ships a write-through
view backed by `users` + `authorized_personnel`. Phase 2 layers on
non-user (external) entries and direct phone-book editing.

## Domain model

Firestore collection: `phoneBook`. Document shape — see
`src/types/phoneBook.ts`. Doc id is `militaryPersonalNumberHash` for any
person on the unit roster (registered or not). External entries (Phase 2)
will use a random doc id and `source='external'`.

```ts
interface PhoneBookEntry {
  id: string;
  source: 'users' | 'authorized_personnel' | 'external';
  userId?: string;                  // Firebase Auth UID once registered
  militaryPersonalNumberHash?: string;
  firstName?: string;
  lastName?: string;
  displayName: string;              // computed at write
  phoneNumber?: string;
  email?: string;
  teamId?: string;
  userType?: UserType;
  photoURL?: string;
  isRegistered: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Sync pipeline (write-through)

Every mutation that touches a person's phone-relevant fields triggers a
phone-book upsert. All upserts are best-effort (try/catch + log) so the
primary write is never blocked by a directory hiccup.

| Trigger | Server hook |
|---------|-------------|
| `POST /api/auth/register` | `serverUpsertPhoneBookFromUser` after `userRef.set(profile)` |
| `PATCH /api/users/profile` | `serverUpsertPhoneBookFromUser` after `serverUpdateUserProfile`, when `phoneNumber` / `teamId` / `profileImage` changed |
| `POST /api/authorized-personnel` | `serverUpsertPhoneBookFromPersonnel` after `serverAddPersonnel` |
| `PUT /api/authorized-personnel` | `serverUpsertPhoneBookFromPersonnel` after `serverUpdatePersonnel` |
| `DELETE /api/authorized-personnel` | `serverDeletePhoneBookEntryByHash` after `serverDeletePersonnel` (skips entries that have a `userId`) |
| `POST /api/authorized-personnel/bulk` | `serverUpsertPhoneBookFromPersonnel` for each non-failed entry |

Order matters when registration follows a personnel-only state: the user
upsert overwrites `source='authorized_personnel'` with `source='users'`
and flips `isRegistered=true`. The personnel-side upsert is defensive —
it never downgrades an entry that is already `source='users'`.

## Backfill

`scripts/backfill-phone-book.js` reads both source collections via
firebase-admin and upserts every doc. Idempotent.

Credentials and project id load from `.env.local` — same
`GOOGLE_SERVICE_ACCOUNT_JSON` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
that the Next.js runtime uses. The cred value is auto-detected:
plain JSON OR base64-encoded JSON both work. No separate `sa.json`
file required and no transpiler (plain CommonJS, runs under `node`
directly).

```
node scripts/backfill-phone-book.js [--dry-run]
```

Run once before pointing client traffic at `/phone-book`.

## Permissions

- **Read** — any authenticated user. Encoded in `firestore.rules`.
- **Write** — admin SDK only. Client SDK writes are denied. The
  application surface never exposes a phone-book edit form in Phase 1.

## UI

`/phone-book` page (`src/app/phone-book/page.tsx`):

- Search input — fuzzy match on display name + first/last + phone + email.
- Team filter — `Select` sourced from `systemConfig.teams` plus any team
  observed in the data.
- Role filter — `Select` over the five `UserType` values.
- Table columns: name (with avatar + unregistered badge) · phone (tel:
  link) · team · role badge · email (mailto: link).

Avatars use `users.photoURL` / `users.profileImage` rendered as a
background-image span (no `<Image />` indirection). Falls back to
initials if no photo.

## Phase 2 follow-ups

- Direct edit UI for `external` entries (suppliers, range officers).
- Admin-side phone-book edit for typo correction without going through
  `/profile`.
- CSV export for managers.
- Optional emergency-contact field.
- Per-field role gating if a privacy review surfaces a need.
