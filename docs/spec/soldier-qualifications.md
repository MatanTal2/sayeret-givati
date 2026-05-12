# Soldier Qualifications + Personal Logistics — Feature Spec

**Status:** Draft (Council synthesis, 2026-05-12)
**Owner:** TBD
**Source:** Claude Council — data-model, UX, permissions perspectives.
**Companion memory:** `project_future_features.md` (Profile section).

---

## 1. Problem and intent

Two distinct datasets need a permanent home on the user profile:

1. **Qualifications / permits** (פק"ל and היתר): structured records of what a soldier is authorized to do — sniper, Humvee driver (with scope: night-operational vs day-operational vs administrative), drone operator (per drone type), rifleman level (רובאי 02–07), commander course, etc. These are *operational*: a TL pulls them up to decide who to crew on a night driving mission.
2. **Personal logistics**: soldier-supplied data needed by the unit's logistics function — vehicle (plate, type, color) for base entry, uniform sizes (pants, shirt, boots, hat) for supply orders. Open to extension over time.

The two classes have *very different trust models* — that drives the entire design. Qualifications are issued by an authority and gate real operational decisions; logistics is self-asserted comfort data. Conflating them produces either a brittle authority model for sizes or a worthless self-serve "I'm a sniper" claim.

---

## 2. Data model

Three top-level Firestore collections + one extension to an existing one.

### 2.1 `qualificationTypes` (catalog — mirrors `equipmentTemplates`)

```ts
export interface QualificationType {
  id: string;                          // e.g. "sniper", "humvee_driver", "drone_op"
  name: string;                        // Hebrew display label or text.ts key
  category: 'WEAPONS' | 'VEHICLES' | 'COMMAND' | 'TECHNICAL' | 'OTHER';
  status: TemplateStatus;              // reuse from src/types/equipment.ts
  schema: QualificationFieldSchema[];  // dynamic field definitions
  defaultExpiryMonths?: number;        // e.g. 24 for driving certs
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QualificationFieldSchema {
  key: string;                         // e.g. "scope", "droneType", "level"
  label: string;                       // Hebrew label / text.ts key
  type: 'enum' | 'multiEnum' | 'string' | 'number' | 'date' | 'boolean';
  options?: string[];                  // for enum / multiEnum
  required: boolean;
}
```

New permit types ship by inserting a `qualificationTypes` document. No code change, no migration. The `schema` drives both the edit form and the display formatter.

### 2.2 `userQualifications` (instances — flat, denormalized)

```ts
export type QualificationStatus = 'pending' | 'active' | 'revoked' | 'expired';

export interface UserQualification {
  id: string;
  userId: string;
  userTeamId?: string;                 // denormalized — required for team queries
  typeId: string;                      // → qualificationTypes
  typeName: string;                    // denormalized
  typeCategory: QualificationType['category']; // denormalized for filters
  status: QualificationStatus;
  qualifiedAt: Timestamp;
  expiresAt?: Timestamp;
  level?: string | number;             // ordinal scale (רובאי 5, sniper 02)
  data: Record<string, string | string[] | number | boolean | Timestamp>;
  notes?: string;
  issuedByUserId?: string;
  issuedByUserName?: string;           // denormalized for UI
  revokedAt?: Timestamp;
  revokedByUserId?: string;
  revokedByUserName?: string;
  revokeReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Why flat, not a subcollection of `users`:** the dominant query is "show me every active Humvee driver in team X" — that requires denormalizing `userTeamId` onto each row regardless. Once denormalized, a flat top-level collection indexes more cheaply and matches the existing `equipment` pattern.

**Why `data` as a typed map:** keeps per-type quirks (`data.scope='night'`, `data.droneTypes=['mavic','skylark']`) out of the top-level shape. Validated against `qualificationTypes.schema` at write time.

### 2.3 `userQualificationClaims` (pending self-claims)

```ts
export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface QualificationClaim {
  id: string;
  userId: string;                      // claimant
  userTeamId?: string;
  typeId: string;
  typeName: string;
  proposedData: Record<string, unknown>;
  proposedQualifiedAt: Timestamp;
  evidenceUrl?: string;                // optional photo of certificate
  status: ClaimStatus;
  rejectReason?: string;
  approvedQualificationId?: string;    // back-pointer when approved
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Separate collection so the active qualifications dataset stays clean and queryable. When a TL approves, a new `userQualifications` row is created and the claim is marked `approved` with a back-pointer.

### 2.4 `userLogistics` (one doc per user, doc id = userId)

```ts
export interface UserLogistics {
  userId: string;                      // doc ID
  vehicle?: {
    plate: string;
    make?: string;
    color?: string;
  };
  sizes: Record<string, string>;       // { pants:'L', shirt:'42', boots:'43', hat:'M' }
  dietary?: string;                    // allergies / diet — open string for now
  updatedAt: Timestamp;
  updatedBy: string;
}
```

Kept out of the `users` doc so the auth-time payload stays light. Kept out of `userQualifications` because semantics differ (sizes don't expire / revoke / require an issuer).

### 2.5 `actionsLog` extension

Reuse, do **not** invent a parallel log. Extend the existing interface with optional generalization fields:

```ts
// add to src/types/equipment.ts (ActionsLog)
entityType?: 'equipment' | 'qualification' | 'qualification_claim' | 'permission_grant';
entityId?: string;
entityName?: string;
```

Existing equipment rows are implicitly `entityType='equipment'` — no backfill needed. New `ActionType` enum values:

```
QUALIFICATION_CLAIMED
QUALIFICATION_GRANTED
QUALIFICATION_REVOKED
QUALIFICATION_EXPIRED
QUALIFICATION_REJECTED
LOGISTICS_UPDATED
```

Auto-expiry runs as a scheduled task; the writer sets `actorId='system'`.

### 2.6 Indexes (Firestore composite)

- `userQualifications`: `(typeId asc, status asc, userTeamId asc)` — TL-scoped "active sniper" lookups.
- `userQualifications`: `(userId asc, status asc)` — profile page reads.
- `userQualifications`: `(typeCategory asc, expiresAt asc)` — "expiring soon" dashboards.
- `userQualificationClaims`: `(userTeamId asc, status asc, createdAt desc)` — TL inbox.

Define these in `firebase/firestore.indexes.json` (create the file if it does not exist; deploy via `firebase deploy --only firestore:indexes`).

---

## 3. Permissions & workflow

### 3.1 Edit matrix

| Action | ADMIN | SYSTEM_MANAGER | MANAGER | TEAM_LEADER (own team) | USER |
|---|---|---|---|---|---|
| Grant qualification directly | ✅ any | ✅ any | ✅ any | ✅ own team | ❌ |
| Approve / reject a claim | ✅ any | ✅ any | ✅ any | ✅ own team | ❌ |
| Revoke qualification | ✅ any | ✅ any | ✅ any | ✅ own team | ❌ |
| Submit self-claim | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own quals | ✅ | ✅ | ✅ | ✅ | ✅ |
| View team quals | ✅ | ✅ | ✅ | ✅ own team | ❌ |
| Edit own logistics (sizes / vehicle / dietary) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit another user's logistics | ✅ | ✅ | ❌ | ❌ | ❌ |
| Hard-delete a qualification (GDPR) | ✅ | ❌ | ❌ | ❌ | ❌ |

Notes:
- `UserRole.EQUIPMENT_MANAGER` is orthogonal to qualifications. It does *not* grant issuer rights.
- An active `permissionGrant` that bumps the actor's effective `userType` is honored, same as the equipment policy already does in `actorToAuthUser`.
- The existing `permissionGrants` collection (PR #41) stays separate — different semantics (7-day technical bump vs months/years operational capability). Share the *patterns* (soft-delete shape, audit fields) but not the collection.

### 3.2 Default flow: claim → approve

1. Soldier opens "Add qualification" on their profile → submits `QualificationClaim` (`status='pending'`, attaches optional evidence photo).
2. TL (or higher) sees pending claims for their team in an inbox (new view, or surfaced on the profile of the claimant for in-scope viewers).
3. **Approve** → server writes a new `userQualifications` row (`status='active'`, populates `issuedBy*`, sets `expiresAt` from `qualificationTypes.defaultExpiryMonths` if any) AND updates the claim to `approved` with `approvedQualificationId` back-pointer.
4. **Reject** → claim → `rejected` with `rejectReason`. No qualification doc created.

Audit entries: `QUALIFICATION_CLAIMED` on submit, then `QUALIFICATION_GRANTED` or `QUALIFICATION_REJECTED` on resolution.

### 3.3 Shortcut: direct issue

Commanders running a course don't want to round-trip 12 claims. `POST /api/qualifications` accepts `directIssue: true` (skips the claim, writes the qualification straight to `active`). Same audit (`QUALIFICATION_GRANTED`), same permission check. Bulk endpoint allowed too.

### 3.4 Revoke and expire

- **Soft delete only.** Status flips to `revoked` or `expired`; `revokedAt`/`revokedBy`/`revokeReason` are populated.
- Holder still sees the qualification in their own history, greyed out, with a "revoked" badge.
- Active-qualification queries filter `status === 'active' && (!expiresAt || expiresAt > now)`.
- A scheduled job (Cloud Function or daily cron) flips active rows to `expired` when `expiresAt` passes.
- Hard delete is ADMIN-only, gated behind an in-app confirmation modal, and writes `QUALIFICATION_PURGED` (new action type) for GDPR-style erasure.

### 3.5 Server enforcement

New endpoints under `src/app/api/qualifications/`:

| Endpoint | Method | Caller policy |
|---|---|---|
| `/api/qualifications` | POST | TL+ in scope; supports `{directIssue, claimId?, ...}` |
| `/api/qualifications/[id]` | PATCH | TL+ in scope (edits notes / metadata) |
| `/api/qualifications/[id]` | DELETE | TL+ in scope; soft revoke. ADMIN-only hard delete via `?hard=true` |
| `/api/qualifications/claims` | POST | any authenticated user (self only) |
| `/api/qualifications/claims/[id]/approve` | POST | TL+ in scope |
| `/api/qualifications/claims/[id]/reject` | POST | TL+ in scope |
| `/api/profile/personal-logistics` | PUT | self only (ADMIN/SYSTEM_MANAGER for other users) |
| `/api/qualification-types` | GET / POST / PATCH | GET: any auth user. Write: ADMIN/SYSTEM_MANAGER only |

Pattern (copy from `src/app/api/users/profile/route.ts`):

```ts
const actorOrError = await getActorOrError(request);
if (actorOrError instanceof NextResponse) return actorOrError;
const actor = actorOrError;
await assertCanIssueQualification(actor, grantee.teamId);
// ...
```

A new policy module `src/lib/db/server/qualificationsPolicy.ts` mirrors the existing equipment policy. `firebase/firestore.rules` denies all client-direct writes to `userQualifications`, `userQualificationClaims`, `qualificationTypes` — all writes go through the Admin SDK behind these API routes.

---

## 4. UI on the profile page

### 4.1 Card placement

Add **two new sibling cards** into the existing `lg:grid-cols-2` grid on `src/app/profile/page.tsx`. **Not** nested inside Military Info — qualifications are first-class operational data and would unbalance the grid.

Recommended order:

```
Personal Info  |  Military Info
Qualifications |  Personal Logistics
Team & Unit    |  Contact Info
System Info    |
```

Both new cards use the existing `bg-white rounded-2xl shadow-lg p-4 sm:p-6` pattern plus `flex flex-wrap` H2 with `shrink-0` icon, matching the fixes that landed on `fix/profile-bugs-batch`.

### 4.2 Answer to "all visible or button to open wizard?"

**Show all qualifications, always, compactly. No reveal-on-click.**

The primary read use case is *glance* ("can this soldier drive the Humvee tonight?"). A click-to-reveal kills that flow. Progressive disclosure is for advanced/rare data; פק"ל is core. Density is solved with chip rendering, not visibility.

### 4.3 Qualifications card — chip list

```
[shield icon] פק"לים והיתרים                                [✎]
[צלף 02] [נהג האמר • לילה] [רחפן: Mavic] [רובאי 05] [קצין]
[+ הוסף פק"ל]
```

- Each chip is a `badge-base` with category color (`success-100/success-800` for operational-critical, `neutral-100/neutral-800` for administrative, `warning-100/warning-800` for expiring-soon, `danger-100/danger-800` for revoked/expired).
- Tap a chip → Radix Popover with full detail (date, level, scope, issuer) and Edit / Revoke buttons (only shown if actor has rights).
- `[+ הוסף פק"ל]` is a ghost button at the end of the chip flow.
- Empty state: centered shield icon, helper copy ("מוסיפים פק"לים כדי שמפקדים יוכלו לשבץ למשימות"), and a primary "Add first qualification" CTA.

### 4.4 Logistics card — definition list

Reuse the `<dl>` + `sm:grid sm:grid-cols-3` pattern already adopted for Personal Info / Military Info:

```
[truck icon] לוגיסטיקה אישית                                [✎]
רכב         12-345-67 · טויוטה היילקס · כסוף
מכנסיים     L
חולצה       42
נעליים      43
כובע        M
```

`[✎]` flips the section to inline-edit mode (same pattern as `PhoneNumberUpdate`). Save / Cancel buttons appear; on save → `PUT /api/profile/personal-logistics`. Empty state: same centered-icon pattern as qualifications.

### 4.5 Qualification add/edit modal

Single Headless UI `Dialog`, used for both add and edit:

- **Field 1:** qualification type — Headless UI `Combobox` over the `qualificationTypes` catalog (searchable Hebrew autocomplete).
- **Field 2..N:** dynamic, driven by `qualificationTypes.schema`. Selecting "Humvee" reveals the scope radio; "Drone operator" reveals the drone-type multi-select; "Sniper" reveals the level field.
- **Final field:** qualification date (date input).
- Save → claim or direct-issue depending on actor rights.
- Edit mode includes a Revoke button (TL+) that opens a confirmation sub-dialog with a reason field.

On mobile (`< 640px`), the modal renders as a bottom sheet (`fixed bottom-0 rounded-t-2xl rounded-b-none`) so the RTL keyboard doesn't fight a centered dialog.

### 4.6 Visual cues (semantic, not decorative)

| Category | Color token | Examples |
|---|---|---|
| Operational-critical | `success-100` / `success-800` | sniper, night-driver, drone operator, commander course |
| Administrative | `neutral-100` / `neutral-800` | admin-only driver, rifleman 02–04 |
| Expiring soon (< 30 days) | `warning-100` / `warning-800` | computed at render |
| Expired / revoked | `danger-100` / `danger-800` | historical chips, low-opacity |

Each chip also gets a 14px category icon (shield / car / drone / rifle / officer-cap) so the signal is not color-only.

---

## 5. Implementation order

Phase 1 — foundation (one branch):
1. Add the four collections to `src/lib/db/collections.ts`.
2. Types in `src/types/qualifications.ts` (new file).
3. Server policy + services in `src/lib/db/server/`.
4. API routes + tests.
5. Firestore rules deny client writes; deploy.
6. Composite indexes; deploy.

Phase 2 — read-only UI:
1. Two new profile cards rendering data via new hooks (`useUserQualifications`, `useUserLogistics`).
2. Empty states.
3. Chip popovers.

Phase 3 — write UI:
1. Qualification claim / add modal.
2. Logistics inline section-edit.
3. TL claim-inbox view (separate route or surfaced on team list).

Phase 4 — lifecycle:
1. Scheduled expiry job.
2. Audit-log tab integration (filter by `entityType='qualification'`).
3. Hard-delete confirmation modal (ADMIN).

Phase 5 — catalog management:
1. Admin UI for `qualificationTypes` (create / edit / archive types and their schema).

---

## 6. Open product questions

These are *not* implementation details — they need a product call before code:

1. **Expiry policy per type.** Do "Humvee driver" certs really expire? At 12 months? 24? Per-type defaults belong on `qualificationTypes.defaultExpiryMonths`. Need a default list.
2. **רובאי levels — ordinal scale vs separate types.** Recommendation: ordinal `level` on a single "Rifleman" qualification doc. Promotions are updates, not new docs. Confirm.
3. **Evidence attachments on claims.** Allow photo upload of a course certificate? If yes, mirror the equipment photo pattern (Firebase Storage + signed URL). Mark as Phase 2 or Phase 3.
4. **Cross-team visibility.** When a soldier rotates teams, does the new TL see the *prior team's* qualification history? Default yes (operational data, not PII). Confirm.
5. **Catalog seed.** Phase 1 needs an initial set of `qualificationTypes` to ship with. Need a product list of the 10–20 most common פק"ל / היתר entries plus their `schema` (fields and options).
6. **`sizes` enum vs free string.** Validate against an Israeli sizing scale or accept any string? Recommend free string for v1 (avoids enum churn), tighten later.

---

## 7. Files touched (forward-looking)

| File | Purpose |
|---|---|
| `src/types/qualifications.ts` | new — all interfaces |
| `src/types/equipment.ts` | extend `ActionsLog` with `entityType` / `entityId` / `entityName` |
| `src/lib/db/collections.ts` | add `qualificationTypes`, `userQualifications`, `userQualificationClaims`, `userLogistics` |
| `src/lib/db/server/qualificationsService.ts` | new — write path |
| `src/lib/db/server/qualificationsPolicy.ts` | new — `assertCanIssueQualification`, scope checks |
| `src/lib/db/server/userLogisticsService.ts` | new — write path |
| `src/app/api/qualifications/route.ts` + nested | new endpoints |
| `src/app/api/qualifications/claims/route.ts` + `[id]/approve`, `[id]/reject` | new endpoints |
| `src/app/api/profile/personal-logistics/route.ts` | new endpoint |
| `src/app/api/qualification-types/route.ts` | new endpoints |
| `src/hooks/useUserQualifications.ts` | new — `{ data, isLoading, error }` shape |
| `src/hooks/useUserLogistics.ts` | new |
| `src/hooks/useQualificationTypes.ts` | new |
| `src/components/profile/QualificationsCard.tsx` | new |
| `src/components/profile/QualificationChip.tsx` | new |
| `src/components/profile/QualificationDialog.tsx` | new — Headless UI `Dialog` |
| `src/components/profile/LogisticsCard.tsx` | new |
| `src/app/profile/page.tsx` | mount the two new cards |
| `src/constants/text.ts` | new Hebrew strings under `PROFILE.QUALIFICATIONS`, `PROFILE.LOGISTICS` |
| `firebase/firestore.rules` | deny client writes to the new collections |
| `firebase/firestore.indexes.json` | composite indexes |
| `docs/codebase/src/types/qualifications.md` (and per-component docs) | per `feedback_docs_with_code` |
