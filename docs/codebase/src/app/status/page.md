# page.tsx (Status)

**File:** `src/app/status/page.tsx`
**Lines:** 1175 ⚠️ LONG — split recommended
**Status:** Active — core feature

## Purpose

Soldier status management page (`/status`). The flagship feature. Loads soldiers from Google Sheets (via `/api/sheets`), caches them in localStorage (12-hour TTL), and presents them in a searchable, filterable, multi-selectable table. Status changes are validated, shown in a password modal, and submitted back to Google Sheets. Reports can be generated and shared. Protected by `AuthGuard`.

## Exports / Public API

- `default StatusPage` — Next.js page component, no props.

## State

| State | Type | Purpose |
|-------|------|---------|
| `soldiers` | `Soldier[]` | Currently displayed (possibly filtered) soldier list |
| `originalSoldiers` | `Soldier[]` | Unmodified copy from the server — used for change detection |
| `loading` | `boolean` | Initial data load indicator |
| `error` | `string \| null` | Top-level error message |
| `lastUpdated` | `Date \| null` | Timestamp of last successful data fetch |
| `isRefreshing` | `boolean` | Manual refresh in progress |
| `isUpdatingChanges` | `boolean` | Status update submission in progress |
| `showPasswordModal` | `boolean` | Password verification modal visibility |
| `password` | `string` | Password input value |
| `passwordError` | `string` | Password validation error message |
| `isUpdatingServer` | `boolean` | Server update call in progress |
| `showPassword` | `boolean` | Password field show/hide toggle |
| `nameFilter` | `string` | Name search input value |
| `debouncedNameFilter` | `string` | Debounced (300ms) version of `nameFilter` |
| `showAddForm` | `boolean` | Add-soldier form visibility |
| `reportText` | `string` | Generated report text content |
| `showPreview` | `boolean` | Report preview panel visibility |
| `isMultiPlatoonReport` | `boolean` | Toggle multi-platoon vs. single-platoon report format |
| `includeIdInReport` | `boolean` | Include military IDs in report text |
| `isDownloading` | `boolean` | File download in progress |
| `showTeamFilter` | `boolean` | Team/platoon filter dropdown visibility |
| `showStatusFilter` | `boolean` | Status filter dropdown visibility |
| `selectedTeams` | `string[]` | Multi-selected platoon/team filters |
| `selectedStatuses` | `string[]` | Multi-selected status filters |
| `formErrors` | `{ name, id, platoon }` | Add-soldier form validation errors |
| `newSoldier` | `NewSoldierForm` | Add-soldier form field values |

## Firebase Operations

None directly. Data comes from Google Sheets API (`/api/sheets`). Caching via `localStorage` through `src/lib/cache.ts`.

## Known Issues / TODO

- `selectionUtils` import is commented out (lines 21-26). Multi-select-by-platoon and multi-select-by-status logic is inline instead of using the shared utility. This creates duplication with `src/lib/selectionUtils.ts`.
- `selectedPlatoonForSelection` and `selectedStatusForSelection` state variables are commented out — their UI is not wired.

## Notes

- **Size concern:** 1175 lines — split into at minimum: filter panel, table container, report panel, add-soldier form, password modal.
- Name filter is debounced 300ms via `useEffect` + `setTimeout`.
- Report generation uses `soldierUtils.ts` helpers.
- WhatsApp sharing uses `navigator.clipboard` + `window.open('https://wa.me/')`.
- Uses both `SoldiersTableDesktop` and `SoldiersTableMobile` — responsive switching via CSS breakpoints.
- `mapRawStatusToStructured` / `mapStructuredStatusToRaw` from `statusUtils.ts` handle the Google Sheets ↔ UI status format conversion.
