
# bugs need to be fix UI/UX

> **Note (2026-04-28):** `usePersonnelManagement` mutations (`addPersonnel`, `updatePersonnel`, `deletePersonnel`) used to update the localStorage `PersonnelCache` only — the React `personnel` state stayed stale, so admin UI rows did not appear/update/disappear until a full re-fetch. Now each success branch also calls `setPersonnel(...)` so the change is reflected in-place without a DB round-trip.
>
> The 44s first-call DELETE seen in `next dev` is dev-only cold start (Next.js compiling the API route + firebase-admin gRPC handshake on first invocation). Subsequent calls are 100–200ms once the singleton in `src/lib/db/admin.ts` is warm. Production (Vercel) reuses the SDK instance across requests; not an action item.

1. ~~in the admin routs when we add CSV or just one personnal to the authorized_personnel we can't use - or ' for names~~
   - **FIXED (2026-04-28):** Two regex broadened to accept hyphens and apostrophes/geresh.
     - `src/utils/validationUtils.ts` `VALIDATION_PATTERNS.HEBREW_NAME`: `/^[א-ת\s\-'׳]+$/` (registration flow).
     - `src/lib/equipmentValidation.ts` `validateUserName.validNamePattern`: `/^[א-תA-Za-z\s\.\-'׳]+$/` (admin AddPersonnel / BulkUpload / UpdatePersonnel via `adminUtils.validateFirstName` / `validateLastName`).
   - Accepts: ASCII hyphen `-`, ASCII apostrophe `'`, Hebrew geresh `׳` (U+05F3). Examples now valid: `כהן-לוי`, `ז'אן`, `ז׳אן`.
   - Tests in `src/utils/__tests__/validationUtils.test.ts` updated: prior reject-hyphen test flipped to accept; new tests for apostrophe and geresh.
2. ~~make sure we can handle multiple possibility to insert phone numbers, ignore not digits chars and multiple - or spaces~~
   - **FIXED (2026-04-28):** New `ValidationUtils.normalizePhoneInput(raw)` in `src/lib/adminUtils.ts` strips every non-digit except a single leading `+`. `isValidIsraeliMobile` and `toInternationalFormat` both delegate to it, so admin AddPersonnel single-add, BulkUpload CSV rows, and UpdatePersonnel all accept noisy inputs (`050-123 4567`, `050.123.4567`, `(050) 123-4567`, `+972 50 123 4567`, `050  -  1234567`, etc.) and persist the canonical international form (`+972XXXXXXXXX`).
   - `updateAuthorizedPersonnel` now normalizes phone before the duplicate check (previously raw user input was compared against stored `+972...`, missing real duplicates) and before sending to the server API.
   - Tests added in `src/lib/__tests__/adminUtils.test.ts` covering `normalizePhoneInput`, `isValidIsraeliMobile`, and `toInternationalFormat`.
3. ~~in the admin panel we need the ability to update some fields in the authorized_personnel.~~
   - **PARTIAL FIX (2026-04-28):** UpdatePersonnel form now also edits `status` (active / inactive / transferred / discharged), in addition to the existing firstName / lastName / rank / phoneNumber / userType. Server already accepts arbitrary update keys via `serverUpdatePersonnel`, but `AdminFirestoreService.updateAuthorizedPersonnel` whitelists fields and validates each — `status` whitelist + enum validation added. `shouldSync` now propagates status changes to the synced `users` doc.
   - New constants: `PERSONNEL_STATUSES` / `PERSONNEL_STATUS_OPTIONS` / `PersonnelStatus` in `src/constants/admin.ts`; Hebrew labels `STATUS_ACTIVE` / `STATUS_INACTIVE` / `STATUS_TRANSFERRED` / `STATUS_DISCHARGED` and `UPDATE_FIELD_STATUS` in `src/constants/text.ts`.
   - Selected-person read-only panel shows current status next to userType. Edit form has a Listbox-backed `Select` (consistent with rank/userType).
   - Remaining: `approvedRole` editing is bug #7 (queued, not in this fix). `email` / `requestedRole` / `roleStatus` / `testUser` / `registered` / `joinDate` deliberately not editable from this form.
4. ~~need to add IsRegisterd field to authorized_personnel.~~
   - **FIXED (2026-04-28):** The `registered` boolean already lives on every `authorized_personnel` doc (`adminUtils.ts:345`). The gap was UI surface area in the admin panel. Now visible in three places:
     - `ViewPersonnel.tsx` — already had a "סטטוס רישום" column with badge + filter (kept as-is).
     - `UpdatePersonnel.tsx` — search-result rows now render the same registered/pending badge alongside rank/phone/userType.
     - `SystemStats.tsx` — main stats grid expanded from 3 cards to 4: Total / Registered / Pending / Recently Added. Recent Activity rows now also render the registration badge next to the date. New text constants `STATS_REGISTERED` / `STATS_PENDING` reuse the existing `VIEW_REGISTERED_BADGE` / `VIEW_PENDING_BADGE` Hebrew labels.
   - System Status card removed from the stats grid (still exposed in the Detailed Information section under `STATS_DB_STATUS` / `STATS_AUTH` / `STATS_SECURITY_RULES`).
5. ~~After successfully adding authorized_personnel in the admin panel, the UI shows a misleading cache message...~~
   - **OBSOLETE (2026-04-28):** `usePersonnelManagement` no longer calls `fetchPersonnel()` after mutations. It uses `PersonnelCache.appendToCache` / `updateInCache` / `removeFromCache` / `clearCache` to keep the cache in sync without re-fetching, so no cache-info message overwrites the success message. No fix required.
6. ~~Admin → AddPersonnel form gives no visible success/failure feedback after submit~~
   - **FIXED (2026-04-28):** `AddPersonnel.tsx` now drives a local `submitState` machine (`idle | submitting | success | error`). Submit button transitions through spinner → green check / red X and reverts after 3s. Status block below the button shows "נוסף בהצלחה" with name + military ID on success, or the backend error string under "הוספת כוח אדם נכשלה". Pattern mirrors `ProfileImageUpload`'s auto-dismiss. Hook contract change: `addPersonnel` now returns `PersonnelOperationResult` so consumers can drive their own UX.
7. `authorized_personnel.approvedRole` is typed as plain `string` and hardcoded to `'soldier'` in three places (`src/lib/adminUtils.ts:334, 358, 590`). It is never selectable in any of the admin forms — AddPersonnel, BulkUpload, and UpdatePersonnel all skip it. The field is meant to be the soldier's military role, the same value that lands in `FirestoreUserProfile.role` after registration.
   - **Why this matters:** `UserRole` enum already exists in `src/types/equipment.ts:177` (SOLDIER / TEAM_LEADER / SQUAD_LEADER / SERGEANT / OFFICER / COMMANDER / EQUIPMENT_MANAGER). Without admin selection, every pre-authorized soldier ships as a generic SOLDIER even when the unit knows they are a TL or sergeant up front. Equipment policy and report-request scoping both key off the registered user's role downstream — wrong default = wrong permissions on first login.
   - **Note:** do NOT confuse with `userType` (UserType: admin/system_manager/manager/team_leader/user) — that is the system access level and is already a dropdown in the admin forms. `approvedRole` is the military role and is a separate concept.
   - **Fix:**
     - Tighten the type: `approvedRole: UserRole` (not `string`) in `src/types/admin.ts:55` and `src/lib/db/server/authorizedPersonnelService.ts:17`.
     - Add a role dropdown (Headless UI Listbox per `feedback_ui_libs`) to AddPersonnel single-add form, BulkUpload (per-row column + a "default role for all rows" selector at the top), and UpdatePersonnel.
     - Default value remains `UserRole.SOLDIER` when admin doesn't pick.
     - Hebrew labels per `src/constants/text.ts` — add a `USER_ROLE_LABELS` map if one doesn't exist (check `src/constants/admin.ts` first).
     - CSV bulk upload: accept role in a new optional column; rows missing the value fall back to the default.
