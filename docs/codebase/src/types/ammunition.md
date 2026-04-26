# types/ammunition.ts

**File:** `src/types/ammunition.ts`
**Status:** Active

## Purpose

Domain types for the ammunition reporting feature. Mirrors the shape used across the new `ammunitionTemplates`, `ammunition`, `ammunitionInventory`, `ammunitionReports`, `ammunitionReportRequests`, and `systemConfig` Firestore collections.

## Tracking modes

| Mode | When | Stock shape |
|---|---|---|
| `BRUCE` | Bullets (boxed) | `bruceCount` + `openBruceState` |
| `SERIAL` | Items with a serial number (צ) — missiles, mines, expensive items | One Firestore doc per serial |
| `LOOSE_COUNT` | Countable, no serial — smoke grenades, נר עשן, launcher grenades | `quantity` per holder |

## Allocation

`USER` / `TEAM` / `BOTH` — declared on each template; controls who is allowed to hold an instance and surfaces in personal-vs-team views.

## Security level

`EXPLOSIVE` (נפיץ) / `GRABBABLE` (חמידה). Informational only — surfaces as a badge in lists and as a column in dashboard exports. Does not affect tracking logic.

## Exports

| Type | Purpose |
|---|---|
| `AmmunitionAllocation` | `'USER' \| 'TEAM' \| 'BOTH'` |
| `TrackingMode` | `'BRUCE' \| 'SERIAL' \| 'LOOSE_COUNT'` |
| `BruceState` | `'FULL' \| 'MORE_THAN_HALF' \| 'LESS_THAN_HALF' \| 'EMPTY'` |
| `SecurityLevel` | `'EXPLOSIVE' \| 'GRABBABLE'` |
| `HolderType` | `'USER' \| 'TEAM'` |
| `AmmunitionSubcategory` | Fixed list: `BULLETS`, `GRENADES`, `LAUNCHER_GRENADES`, `SHOULDER_MISSILES`, `MINES`, `OTHER` |
| `AmmunitionTemplateStatus` | `'CANONICAL' \| 'PROPOSED' \| 'PENDING_REQUEST'` |
| `AmmunitionItemStatus` | `'AVAILABLE' \| 'CONSUMED' \| 'LOST' \| 'DAMAGED'` |
| `AmmunitionReportRequestScope` | `'INDIVIDUAL' \| 'TEAM' \| 'ALL'` |
| `AmmunitionReportRequestStatus` | `'OPEN' \| 'CLOSED' \| 'CANCELED'` |
| `AmmunitionType` | Template document (`ammunitionTemplates`) |
| `AmmunitionStock` | BRUCE / LOOSE_COUNT stock per holder (`ammunitionInventory`) |
| `AmmunitionItem` | SERIAL item (`ammunition`) |
| `AmmunitionReport` | Submitted usage report (`ammunitionReports`) |
| `AmmunitionReportRequest` | Manager-triggered report request (`ammunitionReportRequests`) |
| `AmmunitionReportRequestFulfillment` | Per-user fulfillment record inside a request |
| `SystemConfig` | Single-doc system settings (`systemConfig/main`); carries `ammoNotificationRecipientUserId` |
