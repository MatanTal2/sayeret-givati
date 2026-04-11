# page.tsx (Settings)

**File:** `src/app/settings/page.tsx`
**Lines:** 400 ⚠️ LONG — split recommended
**Status:** Active (UI-only — no backend writes implemented)

## Purpose

Settings page (`/settings`). Provides a comprehensive settings UI covering profile management, notification preferences, display options, and account security. All interactive controls are **UI-only placeholders** — toggle and button handlers log to console but perform no Firestore writes. Protected by `AuthGuard`.

## Exports / Public API

- `default SettingsPage` — Next.js page component, no props.

## State

| State | Type | Purpose |
|-------|------|---------|
| `settings` | `{ emailNotifications, equipmentTransferAlerts, language, theme }` | Local toggle state — not persisted |
| `profileImageUrl` | `string \| undefined` | Profile image optimistic local state |

## Known Issues / TODO

- All settings toggles are UI-only. No Firestore write is connected to any toggle or button.
- `handleToggle` — logs to console, changes local state only.
- `handleButtonClick` — logs to console, no action.
- `handleImageUpdate` — does not persist image to Firestore.
- `mockPhoneNumber` and `mockPendingTransfers` are hardcoded placeholder values.

## Notes

- Comment in source: "All functionality is UI-only (placeholders) as requested."
- `dir="rtl"` added on wrapper div — redundant (already on `<html>`).
- This page is 400 lines with many repeated section patterns (each settings group is a card). Good candidate for extracting `SettingsSection` and `SettingsToggleRow` sub-components.
