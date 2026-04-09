# Feature: Soldier Status Management

## What Exists (Implemented)

A full-featured soldier status tracking page (`/status`) for unit commanders. Soldiers are loaded from a Google Sheets backend (via `/api/sheets`), cached in `localStorage` for 12 hours, and displayed in a searchable, filterable table. Status changes are submitted back to Google Sheets after password verification. Reports can be generated and shared via WhatsApp or downloaded as a text file.

**Primary page:** `src/app/status/page.tsx` (1175 lines ⚠️)  
**Data hook:** `src/hooks/useSoldiers.ts` (442 lines ⚠️)  
**Cache:** `src/lib/cache.ts` — 12-hour TTL localStorage  
**Data source:** Google Sheets API via `src/app/api/sheets/route.ts`

---

## User Stories

### Viewing Soldiers
- As a user, I can see all soldiers in a table with their name, rank, ID, platoon/team, and current status.  
  **Status:** ✅ Implemented
- As a user on mobile, I see a card-based list view instead of a table.  
  **Status:** ✅ Implemented
- As a user, I can search soldiers by name (debounced, 300ms).  
  **Status:** ✅ Implemented
- As a user, I can filter soldiers by team/platoon using a multi-select dropdown.  
  **Status:** ✅ Implemented
- As a user, I can filter soldiers by status (home, guard, other, custom).  
  **Status:** ✅ Implemented

### Managing Status
- As a user, I can select individual soldiers or select all visible soldiers.  
  **Status:** ✅ Implemented
- As a user, I can change the status of selected soldiers (home / guard / other / custom text).  
  **Status:** ✅ Implemented
- As a user, I must enter a password to submit status changes to the server.  
  **Status:** ✅ Implemented — password is hardcoded in the Google Sheets integration (not user-auth)
- As a user, I can add a new soldier via an inline form (name, ID, platoon, status, notes).  
  **Status:** ✅ Implemented — form validation included

### Reports
- As a user, I can generate a formatted status report showing counts per status.  
  **Status:** ✅ Implemented
- As a user, I can toggle between a single-platoon and multi-platoon report format.  
  **Status:** ✅ Implemented
- As a user, I can choose whether to include military IDs in the report.  
  **Status:** ✅ Implemented
- As a user, I can share the report via WhatsApp or download it as a text file.  
  **Status:** ✅ Implemented

### Data Management
- As a user, I can manually refresh data from Google Sheets.  
  **Status:** ✅ Implemented
- As a user, cached data is shown while fresh data loads (12-hour TTL).  
  **Status:** ✅ Implemented
- As a user, I see a "last updated" timestamp.  
  **Status:** ✅ Implemented

---

## In-Progress / TODO

- **Selection utilities commented out:** `src/app/status/page.tsx` has `selectionUtils` imports commented out (`createToggleAllVisibleHandler`, etc.). The multi-select logic is inline instead. Tracked in duplications/refactor backlog.
- **`selectedPlatoonForSelection` / `selectedStatusForSelection` state:** commented out — the selection-by-platoon/status feature exists in `selectionUtils.ts` but is not wired up in the UI.
- **Authentication dependency:** The page uses `AuthGuard` but the password modal uses a separate hardcoded password (not tied to user auth). This is a design inconsistency to resolve.

---

## Screens / Routes Involved

| Screen | File |
|--------|------|
| Main page | `src/app/status/page.tsx` |
| Desktop table | `src/app/components/SoldiersTableDesktop.tsx` |
| Mobile table | `src/app/components/SoldiersTableMobile.tsx` |
| Add soldier form | `src/app/components/AddSoldierForm.tsx` |
| Password modal | `src/app/components/PasswordModal.tsx` |
| Selection bar | `src/app/components/SelectionBar.tsx` |
| Name search | `src/app/components/SearchBar.tsx` |
| Select all checkbox | `src/app/components/SelectAllCheckbox.tsx` |
| Status toggle | `src/app/components/StatusToggle.tsx` |
| Report preview | `src/app/components/ReportPreview.tsx` |
| Data API | `src/app/api/sheets/route.ts` |
