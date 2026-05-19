# SystemConfigTab.tsx

**File:** `src/components/management/tabs/SystemConfigTab.tsx`
**Status:** Active

## Purpose

System-wide settings surface inside `/management`. Owns the two operational
flags that managers update day-to-day:

- **Ammunition managers** — array of user UIDs flagged to receive ammo report
  notifications and to count as ammo-responsible for training-plan approvals.
- **Round open** — gates pull-from-storage on equipment items in
  `EquipmentStatus.STORED`.

Both settings live on the single Firestore doc `systemConfig/main`. Teams
allowlist + authorized personnel stay on `/admin` (identity boundary); the
ownership split is documented in `docs/spec/settings-ownership.md`.

## Composition

The tab is now a thin shell — most of the recipient UI lives in a child
component:

| Component | Responsibility |
|---|---|
| `AmmoRecipientsSection` (`./system-config/AmmoRecipientsSection.tsx`) | Read-only list + inline edit mode for `ammoNotificationRecipientUserIds` |
| Inline Headless UI `<Switch>` block | `roundOpen` toggle |

## State

| State | Type | Purpose |
|-------|------|---------|
| `roundOpen` | `boolean` | Local copy of the round-open toggle; mirrored from `config.roundOpen` on hydrate |
| `savingRound` | `boolean` | Disables the round save button while the request is in-flight |
| `toast` | `{ kind, message } \| null` | 3-second success/error chip next to the round save button |

Recipient editing state (`pending`, `editing`, `saving`, `error`) lives inside
`AmmoRecipientsSection` and is invisible to the tab.

## Behavior

- Reads `systemConfig/main` via `useSystemConfig()`.
- `AmmoRecipientsSection` is fed the persisted array and a callback that
  forwards to `useSystemConfig().save({ ammoNotificationRecipientUserIds })`.
  When the save fails the callback throws so the child surfaces the error
  inline.
- Round toggle uses a separate save button so a stale roundOpen edit doesn't
  get bundled with a recipient change.
- Admin gate: `UserType.ADMIN || UserType.SYSTEM_MANAGER || UserType.MANAGER`.
  Server enforces the same check via `/api/system-config` PUT.

## Round-activation toggle

Headless UI `<Switch>` bound to `roundOpen`. The thumb is **absolutely
positioned** with the logical `start-1` (off) / `start-6` (on) properties —
the previous `flex + translate-x-*` pattern pushed the thumb out of the pill
in RTL because `translate-x` is physical.

## Notes

- The earlier inline `UserSearchInput` was replaced by
  `AmmoRecipientsSection`. The new layout mirrors profile-section pattern
  (edit pencil top-left, view-mode shows display names only — no emails).
- Storage field on the doc is now an array (`ammoNotificationRecipientUserIds:
  string[]`). One-shot migration script:
  `scripts/migrate-ammo-recipient-to-array.mjs`.
