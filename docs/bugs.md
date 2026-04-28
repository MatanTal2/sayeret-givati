
# bugs need to be fix UI/UX

1. in the admin routs when we add CSV or just one personnal to the authorized_personnel we can't use - or ' for names
wqe need to support this chars
2. make sure we can handle multiple possibility to insert phone numbers
ignore not digits charas and multiple -  or spaces
3. in the admin panel we need the ability to update some fields in the authorized_personnel.
4. need to add IsRegisterd field to authorized_personnel.
5. After successfully adding authorized_personnel in the admin panel, the UI shows a misleading cache message ("הנתונים נטענו מהמטמון המקומי") instead of the success message.
   - **Root cause:** `usePersonnelManagement.ts:100` calls `fetchPersonnel()` without `forceRefresh=true` after a successful add. Since cached data exists from the initial page load, `fetchPersonnel()` returns cached data and overwrites the success message with the cache info message.
   - **Fix:** Change `await fetchPersonnel()` to `await fetchPersonnel(true)` on line 100 (and similarly on lines for update/delete/bulk-add). This ensures fresh data is fetched from Firestore after mutations.
6. Admin → AddPersonnel form gives no visible success/failure feedback after submit — the only indication is that the form fields clear. User cannot tell whether the personnel was actually added or whether the action silently failed.
   - **File:** `src/app/admin/components/AddPersonnel.tsx` (single-add form). Likely the submit handler in `usePersonnelManagement.ts` already returns a success/error, but the component does not render it.
   - **Fix:** render an inline status message below the form (success: "נוסף בהצלחה" with name + military ID; error: the actual error string) AND change the submit button state during the request — show a spinner + disabled while in flight, briefly flash a green check on success, red X on error. Auto-dismiss after ~3s, same UX as `ProfileImageUpload`'s status block. Confirm bug #5 fix (forceRefresh) is also applied so the success message is not overwritten by the cache-loaded message.
7. `authorized_personnel.approvedRole` is typed as plain `string` and hardcoded to `'soldier'` in three places (`src/lib/adminUtils.ts:334, 358, 590`). It is never selectable in any of the admin forms — AddPersonnel, BulkUpload, and UpdatePersonnel all skip it. The field is meant to be the soldier's military role, the same value that lands in `FirestoreUserProfile.role` after registration.
   - **Why this matters:** `UserRole` enum already exists in `src/types/equipment.ts:177` (SOLDIER / TEAM_LEADER / SQUAD_LEADER / SERGEANT / OFFICER / COMMANDER / EQUIPMENT_MANAGER). Without admin selection, every pre-authorized soldier ships as a generic SOLDIER even when the unit knows they are a TL or sergeant up front. Equipment policy and report-request scoping both key off the registered user's role downstream — wrong default = wrong permissions on first login.
   - **Note:** do NOT confuse with `userType` (UserType: admin/system_manager/manager/team_leader/user) — that is the system access level and is already a dropdown in the admin forms. `approvedRole` is the military role and is a separate concept.
   - **Fix:**
     - Tighten the type: `approvedRole: UserRole` (not `string`) in `src/types/admin.ts:55` and `src/lib/db/server/authorizedPersonnelService.ts:17`.
     - Add a role dropdown (Headless UI Listbox per `feedback_ui_libs`) to AddPersonnel single-add form, BulkUpload (per-row column + a "default role for all rows" selector at the top), and UpdatePersonnel.
     - Default value remains `UserRole.SOLDIER` when admin doesn't pick.
     - Hebrew labels per `src/constants/text.ts` — add a `USER_ROLE_LABELS` map if one doesn't exist (check `src/constants/admin.ts` first).
     - CSV bulk upload: accept role in a new optional column; rows missing the value fall back to the default.
