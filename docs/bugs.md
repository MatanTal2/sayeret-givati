
# bugs need to be fix UI/UX

> **Note (2026-04-29):** Incomplete-registration leak fixed on `fix/incomplete-registration-leak`. Bugs addressed in one branch:
> - **Orphan Firebase Auth user on abandon** — `RegistrationModal` now calls `deleteCurrentUser()` on close/back/unmount; falls back to `signOutCurrentUser()` if `auth/requires-recent-login`. New helpers in `src/lib/firebasePhoneAuth.ts`, sessionStorage flag in `src/lib/registrationFlowFlag.ts`.
> - **AuthContext authenticated orphans** — listener now signs out a Firebase user that has no Firestore profile unless `registrationInProgress` is set.
> - **Welcome popup on partial profile** — `AppShell.needsOnboarding` now also requires `firstName` + `lastName`.
> - **Unprotected routes** — `/tools`, `/tools/convoy`, `/tools/logistics`, `/test-dashboard` now wrapped in `AuthGuard`.
> - **Team text input** — replaced with dropdown sourced from `systemConfig/main.teams`. Admin can manage the list under admin → System Config tab. Empty list shows Hebrew "no teams configured" error.
> - **Background scrolls behind overlays** — new `useScrollLock` hook applied to `WelcomeModal` and (mobile only) `ManagementSidebar`.
> - **Firebase phone-auth alignment** — reCAPTCHA now reset on send-failure path; `appVerificationDisabledForTesting` enabled in the Jest mock.

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
8. Admin-created templates still show "wait for approval" message
   - **Repro:** Sign in as `userType: ADMIN` (or `SYSTEM_MANAGER`). Equipment page → "Request new template". Submit. UI shows "ההצעה נשלחה לבדיקה" and the template lands as `PROPOSED`, requiring another admin to approve it.
   - **Why this matters:** Admins are already the approval authority. Forcing self-approval is friction with no security benefit, and the misleading message makes admins think the action failed silently.
   - **File paths:**
     - UI entry point: `src/components/equipment/RequestNewTemplateFlow.tsx:54` (calls `proposeTemplate`).
     - API: `src/app/api/equipment-templates/propose/route.ts:11–58`.
     - Server logic (the bug): `src/lib/db/server/templateRequestService.ts:51–54` — only branches `USER` vs everyone else; admin / system_manager get `PROPOSED` like a TL.
     - Status enum: `src/types/equipment.ts:7–12`.
   - **Suggested fix:** In `serverProposeTemplate`, if `proposerUserType` is `ADMIN` or `SYSTEM_MANAGER`, write `status: CANONICAL`, `isActive: true`, `reviewedByUserId: proposerUserId`, `reviewedAt: now`. Update the client success message accordingly ("התבנית נוצרה" not "ההצעה נשלחה לבדיקה"). Add a unit test covering each `userType` → status mapping. Permission check (`canProposeTemplate`) already lets admins through, so no policy change.
9. Category & subcategory rendered as raw Firestore doc IDs in templates lists
   - **Repro:** Management → Equipment Templates tab. Both the proposed-templates rows and the canonical-templates rows show opaque doc IDs in the category and subcategory columns instead of Hebrew names.
   - **Why this matters:** Unreadable. Admin can't tell what they're looking at without cross-referencing Firestore.
   - **File paths:**
     - Render sites: `src/components/management/tabs/TemplatesTab.tsx:205–206` (proposed list) and `:327–332` (canonical list).
     - Working precedent — already resolves IDs to names: `src/components/management/tabs/TemplateForm.tsx:79–96` uses `CategoriesService.getCategories()`.
     - Schema confirming the fields are IDs not names: `src/types/equipment.ts:18–19`.
   - **Suggested fix:** Lift the category lookup the form already does into `TemplatesTab` (or extract a `useCategoryLookup` hook returning `(id) => name`). Render `lookup(t.category) / lookup(t.subcategory)` everywhere, falling back to the raw ID in a warning style if unresolved (helps surface orphan refs).
10. Manage Templates rows overflow on narrow screens; need collapsed default
    - **Repro:** Management → Equipment Templates. Row width exceeds viewport on laptop and mobile; horizontal scroll required to see actions.
    - **Why this matters:** Action buttons get pushed off-screen and admins miss them.
    - **Suggested redesign (per user request):**
      - Collapsed row by default: **template name + actions only**.
      - Click row → expands to reveal description, category / subcategory (resolved per #9), serial-number flag, daily-status flag, status, audit timestamps.
      - Use Headless UI `Disclosure` per the project's UI-libs preference (no custom expand/collapse logic).
    - **File paths:** `src/components/management/tabs/TemplatesTab.tsx` row markup around lines 200–235 (proposed) and 327–332 (canonical).
    - **Suggested fix:** Replace the flat row markup with `<Disclosure>`. Apply to both the proposed and canonical sections so they stay visually consistent.
11. Canonical templates list missing edit + delete actions
    - **Repro:** Management → Equipment Templates → canonical section. Each row shows a static "פעיל" label. No way to rename, change description, change required flags, or remove a template.
    - **Why this matters:** Mistakes in canonical templates are unfixable from the UI; admins must edit Firestore by hand.
    - **File paths:** `src/components/management/tabs/TemplatesTab.tsx:327–332` (action cell is hardcoded text).
    - **Suggested fix:**
      - **Edit:** open the existing `TemplateForm` (currently only used for create) prefilled with the template; submit hits a new `PATCH /api/equipment-templates/:id` (or reuse the existing canonical write endpoint with merge semantics). Audit entry to `actionsLog`.
      - **Delete:** soft-delete by flipping `isActive: false` and `status` to a tombstone value, **not** physical delete — equipment items reference template IDs and would orphan. Confirm via Headless UI `Dialog`. Audit entry.
      - Permission: ADMIN + SYSTEM_MANAGER only.
12. ~~Canonical template `status` field is dead UI~~
    - **RESOLVED by bug #11 (2026-04-30):** the hardcoded "פעיל" label is gone. The canonical action cell now renders edit + retire buttons for ADMIN / SYSTEM_MANAGER, and a "מושבת" warning badge once a template has been retired (`isActive: false`). Retire/edit each write an `actionsLog` entry (`TEMPLATE_RETIRED`, `TEMPLATE_UPDATED`).
    - **Why we did NOT remove `EquipmentType.status`:** the field is load-bearing for the propose/approve lifecycle (`PROPOSED → CANONICAL → REJECTED`). The canonical UI uses `isActive` for the active/retired distinction; `status` stays where it belongs.
13. Management page tab resets to "Manage Users" on refresh
    - **Repro:** Management → any tab other than Users (e.g. Equipment Templates). Browser refresh. Lands on Users tab instead of the previous tab.
    - **Why this matters:** Loses context, especially when iterating on template edits between bug fixes.
    - **File paths:** `src/hooks/useSidebar.ts:14–55` — active tab is local `useState`, no URL or storage persistence; `useManagementTabs` returns the first available tab as default.
    - **Suggested fix:** Persist the active tab in the URL as a query param (`?tab=templates`) — cheapest, also makes individual tabs linkable / shareable. On mount, read from `useSearchParams`; on tab change, `router.replace` with the new param. Avoid `localStorage` (cross-browser drift) and `sessionStorage` (refresh in a new tab loses it).
15. ~~Add-equipment wizard hides every newly-created template; no "all subcategories" affordance~~
    - **Repro (root cause):** Equipment → Add new → "פריט יחיד" → pick a category whose templates were created via the management UI. Template list is empty. Same templates ARE visible in Management → Equipment Templates. Confirmed with a real doc: template `3PvWrnPkzsaizs5wjDVO` carries `subcategory: 'FNhJ1zSkJWYevRBqokbt'`, the subcategory doc exists, parent category doc exists — IDs all line up. Doc just never reaches the wizard.
    - **Why:** `EquipmentTypesService.getEquipmentTypes()` ran `query(collection, orderBy('sortOrder'), orderBy('name'), where('isActive', '==', true))`. Firestore excludes any doc missing the orderBy field — and neither `serverCreateEquipmentType` nor `serverProposeTemplate` writes `sortOrder`. So every template created from the UI was silently dropped. `EquipmentTypesService.getTemplates()` (used by management) does no orderBy, which is why the same docs showed up there.
    - **Repro (secondary UX):** even with templates loading, the only way to view "all subs of this category" was to click the unlabeled `'—'` clear row in the subcategory dropdown.
    - **FIXED (2026-04-30) on `fix/equipment-template-ux`:**
      - `equipmentService.ts:getEquipmentTypes` — drop Firestore `orderBy('sortOrder')` / `orderBy('name')`. Sort the result client-side: `sortOrder ?? MAX_SAFE_INTEGER` then `name.localeCompare`. Legacy seeded docs that have `sortOrder` keep their order; new docs fall to the end-of-sortOrder bucket and sort by name among themselves. Filters (`isActive`, `category`) still run on Firestore.
      - `WizardStepTemplate.tsx`: category dropdown + subcategory dropdown (Headless UI `Listbox` via shared `Select`). Subcategory dropdown gets an explicit "הכל" option (sentinel `__all__` translated to `null` at the boundary) so the default-all state is a labeled choice rather than a clear-row affordance.
      - Templates render as Headless UI `Disclosure` rows. **Single click on the row both selects the template (`onPick`) and toggles the panel** so the user can keep the wizard moving while inspecting details. Active row keeps `border-primary-500 bg-primary-50` regardless of open state.
      - Compact header: `[צ]` `[דיווח]` badges → name → chevron, with description on a second line. Expanded panel surfaces the remaining template fields (`notes`, `defaultCatalogNumber`); falls back to `TEMPLATE_NO_EXTRA_INFO` when both are absent.
      - Text constants: `ALL_SUBCATEGORIES`, `TEMPLATE_NOTES_LABEL`, `TEMPLATE_DEFAULT_CATALOG_LABEL`, `TEMPLATE_NO_EXTRA_INFO`.
18. ~~Add-equipment wizard treats photo as mandatory even for non-serialized items + camera shows a black square instead of a live feed~~
    - **Repro:** Equipment → Add new. Pick any template whose `requiresSerialNumber === false` (e.g. consumables / non-צ items). The "צילום הפריט" field renders a red `*`, the wizard refuses to advance past the details step without a photo, and submit-time validation in `AddEquipmentWizard.tsx` throws `PHOTO_REQUIRED_ERROR`. Separately, when the photo field renders, `CameraCapture` is mounted with `autoStart={false}` — the user sees a 3:4 black `<video>` placeholder above a "התחל מצלמה" button, then has to click before the live feed appears.
    - **Why this matters:** Non-צ items (e.g. magazines, batteries, generic accessories) don't carry per-item identity — the picture lives on the *template*, not the *item*. Forcing a photo per item is duplicate data entry. The two-step camera UX (placeholder + Start) wastes vertical space and is an extra tap on every item.
    - **FIXED (2026-04-30) on `fix/equipment-template-ux`:**
      - **Schema** (`src/types/equipment.ts`): `Equipment.photoUrl` flipped from `string` to `string?` with an updated comment explaining the new policy ("required for serialized items, optional for non-serialized templates").
      - **PhotoBox** (`EquipmentTable.tsx`): prop type relaxed to `url?: string`. Existing `if (!url)` branch already rendered a neutral placeholder, so missing photos are handled.
      - **Validation** (`AddEquipmentWizard.tsx`): `computeCanGoNext` and the submit loop now treat photo as required only when `template.requiresSerialNumber`. Submit writes `photoUrl: photoUrl ?? undefined` so JSON serializes the field out for non-serialized items.
      - **UI** (`WizardStepDetails.tsx`): the red `*` becomes "(אופציונלי)" when the template doesn't require a serial.
      - **Camera placeholder UX** (`CameraCapture.tsx`): the original code mounted the `<video>` element up-front, which rendered as a 3:4 black box above the Start button. Replaced with a single dashed-outline button ("פתח מצלמה") plus a permission-prompt hint when the camera is idle; the `<video>` element is mounted only after the user clicks Start (which triggers `getUserMedia` and the browser's permission dialog). Live feed + capture button render in place once the stream is active. Initial-render mount stays `autoStart={false}`. New text constant `CAMERA.PERMISSION_HINT = 'הדפדפן עשוי לבקש אישור גישה למצלמה'`.
      - Future-feature note: capturing a representative photo on the **template** itself (so non-serialized items inherit it for display) is in `project_future_features.md` and not in this bug's scope.
17. ~~Equipment row actions menu clipped by collapsed row~~
    - **Repro:** Equipment page → click the `MoreVertical` (⋮) on a collapsed row. Dropdown rendered inside the row container and was clipped by the row's `overflow-hidden`. Expanding the row first made the menu fully visible — that was the workaround users were forced into.
    - **Why:** `EquipmentRowActions` used a hand-rolled `absolute`-positioned div, which is laid out within the nearest scroll/clip ancestor. The `<li>` wrapper in `EquipmentTable.tsx` is `overflow-hidden` so the row collapses cleanly, which clipped the dropdown.
    - **Secondary UX:** the destructive option (`return` / "החזר") was sandwiched between safe actions, with only a color tone to distinguish it.
    - **FIXED (2026-04-30) on `fix/equipment-template-ux`:** rewrote `EquipmentRowActions.tsx` on Headless UI `Menu` (per `feedback_ui_libs`). `MenuItems` uses `anchor="bottom end"`, which portals the panel via Floating UI and escapes any ancestor `overflow-hidden`. Items now split into a safe group (`report`, `transfer`, `history`) and a danger group (`return`); a `border-t` divider renders between them when both groups are non-empty. Click-outside / Esc / focus management all come from Headless UI.
16. ~~Equipment table expanded row shows raw doc ID for category~~
    - **Repro:** Equipment page → expand any row. "קטגוריה" field rendered the raw Firestore doc ID instead of the Hebrew category name. Same root cause as bug #9 in `TemplatesTab`: `Equipment.category` (and `Equipment.subcategory`) are stored as IDs, not names.
    - **FIXED (2026-04-30) on `fix/equipment-template-ux`:** `EquipmentTable.tsx` now consumes `useCategoryLookup` (already used by `TemplatesTab`) and passes the resolvers down through `EquipmentRow` into `ExpandedPanel`. The category field renders `cat / sub`, and unresolved IDs fall back to `text-warning-700` rendering of the raw ID — same pattern as `TemplatesTab` so orphan refs surface visibly.
14. New template added from management page does not appear in canonical list (likely doc-shape divergence)
    - **Repro:** Management → Equipment Templates → add a new template. Submit succeeds. The list does not include the new row. Page refresh — still not there. Firestore shows a new doc has been written, but its shape **differs** from a doc created via the equipment-page propose flow.
    - **Why this matters:** Two creation paths producing divergent doc shapes is a silent data-integrity bug; downstream readers can filter the management-created doc out without warning, and admins cannot trust the list.
    - **What we know from the code:**
      - Management write path: `TemplatesTab.tsx:91` → `EquipmentTypesService.createEquipmentType()` → `POST /api/equipment-templates` → `serverCreateEquipmentType()` (`src/lib/db/server/equipmentTemplatesService.ts:20`). Sets `status: CANONICAL`, `isActive: true`.
      - Equipment-page write path: `proposeTemplate()` → `POST /api/equipment-templates/propose` → `serverProposeTemplate()` (`src/lib/db/server/templateRequestService.ts:44`). Sets `status: PROPOSED | PENDING_REQUEST`, `isActive: false`, plus proposer / timestamp fields.
      - Both target the same `equipmentTemplates` collection.
      - `TemplatesTab` does call `await refresh()` after create (`:107`), so a stale cache alone does not explain it.
    - **Likely cause to investigate:** the management-create payload omits a field the canonical-list filter requires (e.g. `templateCreatorId`, `proposedAt`, `category` / `subcategory` set incorrectly, or `isActive` not surviving the write). Diff the two on-disk doc shapes against the list query in `EquipmentTypesService.getTemplates()`.
    - **Suggested fix:**
      - Diff the two doc shapes; align `serverCreateEquipmentType` to write the same field set as `serverProposeTemplate` (sans the lifecycle-only ones), or relax the list query so it does not depend on the missing field.
      - Add a server-side test that creates one doc through each path and asserts both appear in `getTemplates()`.
