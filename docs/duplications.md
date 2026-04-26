# Duplications

All known redundancies in the codebase. Address these before adding new code that touches the affected areas.

Severity: **High** (causes bugs or real maintenance pain) | **Medium** (friction and inconsistency) | **Low** (cosmetic / nice-to-fix)

---

## Types

### 1. `Soldier` interface — exact duplicate
**Severity: High**

| Location | File |
|----------|------|
| Definition 1 | `src/types/index.ts` |
| Definition 2 | `src/app/types.ts` |

Both files export an identical `Soldier` interface. Any change must be made in two places.

**Fix:** Delete `src/app/types.ts`. Update any imports that reference `@/app/types` to use `@/types`.

---

### 2. `ValidationResult` — three incompatible shapes
**Severity: High**

| Location | Shape |
|----------|-------|
| `src/utils/validationUtils.ts` | `{ isValid: boolean; errorMessage: string \| null }` |
| `src/types/admin.ts` | `{ isValid: boolean; errors: Record<string, string> }` |
| `src/lib/equipmentValidation.ts` | `{ isValid: boolean; errors: Record<string, string>; warnings?: Record<string, string> }` |

Three callers expect three different return shapes from "validation". Code cannot be shared across domains without casting.

**Fix:** Define a canonical `ValidationResult<T>` in `src/types/` (likely the equipment variant which is a superset). Migrate the other two usages.

---

### 3. User profile types — four overlapping definitions
**Severity: Medium**

| Type | File |
|------|------|
| `AuthUser` | `src/contexts/AuthContext.tsx` |
| `EnhancedAuthUser` | `src/types/user.ts` |
| `FirestoreUserProfile` | `src/types/user.ts` |
| `UserProfile` | `src/lib/userService.ts` |

Each captures slightly different fields. `AuthContext` holds all four in varying combinations.

**Fix:** Remove `UserProfile` from `userService.ts` (use `FirestoreUserProfile` from types). Clarify the boundary between `AuthUser` (Firebase Auth surface) and `EnhancedAuthUser` (Firestore-enriched).

---

## Constants

### 4. `EQUIPMENT_COLLECTION` — defined in two service files
**Severity: Medium**

| File | Line |
|------|------|
| `src/lib/equipmentService.ts` | ~44 |
| `src/lib/transferRequestService.ts` | ~43 |

Both define `const EQUIPMENT_COLLECTION = 'equipment'`. If the collection is renamed, both must be updated.

**Fix:** Create `src/lib/firestoreCollections.ts` (or `src/constants/firestore.ts`) that exports all collection name constants. Import from there everywhere.

---

### 5. `NOTIFICATIONS_COLLECTION` — constant vs. hardcoded string
**Severity: Medium**

| File | How it's referenced |
|------|---------------------|
| `src/utils/notifications.ts` | `const NOTIFICATIONS_COLLECTION = 'notifications'` |
| `src/contexts/NotificationContext.tsx` | Hardcoded string `'notifications'` |

**Fix:** Import the constant from `notifications.ts` into `NotificationContext.tsx`. Better: move all collection constants to a shared file (see #4).

---

### 6. Validation pattern constants — split across two files
**Severity: Low**

| File | What it defines |
|------|-----------------|
| `src/constants/admin.ts` | `VALIDATION_PATTERNS` regex constants |
| `src/utils/validationUtils.ts` | Duplicate or closely related phone/ID regex |

**Fix:** Consolidate all validation regex constants into `src/constants/admin.ts` or a new `src/constants/validation.ts`. Import into `validationUtils.ts`.

---

## Query Patterns

### 7. Notification base query — repeated 3×
**Severity: Medium**

The pattern `query(collection(db, NOTIFICATIONS_COLLECTION), where('userId', '==', userId), orderBy('createdAt', 'desc'))` appears in:

| File | Function |
|------|----------|
| `src/contexts/NotificationContext.tsx` | `NotificationProvider` (real-time listener) |
| `src/utils/notifications.ts` | `getNotifications` |
| `src/utils/notifications.ts` | `cleanupOldNotifications` |

**Fix:** Extract a `buildNotificationBaseQuery(userId)` helper in `notifications.ts`. All three sites call it.

---

### 8. Actions log base query — repeated 5×
**Severity: Medium**

All occurrences in `src/lib/actionsLogService.ts`. The base structure:
```
query(collection(db, ACTIONS_LOG_COLLECTION), [where clause], orderBy('timestamp', 'desc'), limit(...))
```
is repeated for each filter variant (by `equipmentDocId`, `actionType`, `actorId`, no filter, timestamp range).

**Fix:** Create a `buildActionLogQuery(filters)` helper within `actionsLogService.ts`.

---

## Service Layer Fragmentation

### 9. User services split across three files
**Severity: Medium**

| File | Responsibility |
|------|---------------|
| `src/lib/userService.ts` (372 lines) | Registration, personnel linking, user search |
| `src/lib/userDataService.ts` (173 lines) | Profile fetching by UID/email, display name helpers |
| `src/lib/communicationService.ts` (168 lines) | Communication preferences (email, alerts) |

No clear boundary — `userDataService` and `userService` both fetch from `users` collection.

**Fix (future):** Merge `userDataService.ts` into `userService.ts`. Keep `communicationService.ts` separate only if its surface grows.

---

### 10. Categories module — three-layer fragmentation
**Severity: Medium**

| File | Role |
|------|------|
| `src/lib/categoriesService.ts` (13 lines) | Root-level re-export / compatibility shim |
| `src/lib/categories/categoriesService.ts` (344 lines) | Business logic |
| `src/lib/categories/repository.ts` (357 lines) | Firestore data access |

The root `categoriesService.ts` is a thin wrapper over the module. Its existence is confusing.

**Fix:** Delete the root shim. Update all imports to use `@/lib/categories` directly.

---

## Batch Operation Patterns

### 11. Repeated batch-write pattern
**Severity: Low**

The pattern "split array into chunks of 100, run `batch.set()` for each, commit" appears in:

| File | Function |
|------|----------|
| `src/lib/adminUtils.ts` | `addAuthorizedPersonnelBulk` |
| `src/lib/equipmentService.ts` | `importEquipmentFromTemplates` |

**Fix (future):** Extract a `batchWrite<T>(items, toDoc)` generic helper in a shared utility.

---

## Migration Notes

### Header → AppShell (completed)

The legacy `src/app/components/Header.tsx` was removed. All top-level pages now wrap their content in `src/app/components/AppShell.tsx` (which composes `TopBar`, `AppSidebar`, `PageHeader`, `QuickActionFab`). The top bar is identical on every page — previously each page constructed its own.

**Not yet migrated** (follow-up work; these pages still carry bespoke inline headers rather than `Header`, so they weren't in scope):
- `src/app/status/page.tsx` — custom inline `<header>` with logo + title + back link (line ~660).
- `src/app/admin/page.tsx` — custom inline header block.

Both should eventually migrate to `AppShell` for full visual consistency.

### Collection name consolidation

`COLLECTIONS` (`src/lib/db/collections.ts`) is now the canonical source of Firestore collection names. New code (e.g. `announcementsService`, `usefulLinksService`) imports from it. Existing services still use their own local constants — see items 4 and 5 in this doc.

---

## Files Flagged for Splitting (> 300 lines)

These files are too long and should be split in a future refactor pass. Documented here as a tracker.

| File | Lines | Split suggestion |
|------|-------|-----------------|
| `src/app/status/page.tsx` | 1175 | Extract table, filter bar, report panel into sub-components |
| `src/constants/text.ts` | 1171 | Split by domain (soldiers, equipment, auth, admin) |
| ~~`src/components/equipment/AddEquipmentModal.tsx`~~ | ~~998~~ | **Deleted in Phase 6** — replaced by `AddEquipmentWizard` (orchestrator + 4 step files in `wizard/`) |
| ~~`src/components/equipment/EquipmentList.tsx`~~ | ~~917~~ | **Deleted in Phase 6** — replaced by `EquipmentTable` + `EquipmentRowActions` + `BulkActionBar` |
| `src/lib/adminUtils.ts` | 880 | Split into security utils, validation utils, firestore service |
| `src/lib/equipmentService.ts` | 725 | Split template service from item service |
| `src/app/test-dashboard/page.tsx` | 778 | Remove from production build or break into test modules |
| ~~`src/lib/equipmentUtils.ts`~~ | ~~614~~ | **Deleted in Phase 6** — superseded by `equipmentService` (Phase 4) + `equipmentPolicy` (Phase 3) + `equipmentValidation` |
| `src/hooks/useSoldiers.ts` | 442 | Extract selection logic, filter logic |
| `src/lib/transferRequestService.ts` | 437 | Split transaction core from notification helpers |
| `src/utils/notifications.ts` | 446 | Split query helpers from email sending |
| `src/utils/validationUtils.ts` | 443 | Split phone, ID, name validators into separate files |
| `src/lib/equipmentValidation.ts` | 416 | Split by form type (new, transfer, bulk) |
| `src/types/equipment.ts` | 414 | Split item types from permission/role types |
| `src/components/registration/RegistrationForm.tsx` | 412 | Already partially split into step components — extract step orchestration |
| `src/hooks/useEquipment.ts` | 390 | Split read and write operations |
| `src/app/settings/page.tsx` | 400 | Extract settings sections as sub-components |
| `src/lib/userService.ts` | 372 | See fragmentation note above |
| `src/components/equipment/TransferModal.tsx` | 366 | Extract approval flow |
| `src/components/registration/RegistrationDetailsStep.tsx` | 360 | Extract field groups |
| `src/components/profile/PhoneNumberUpdate.tsx` | 361 | Extract validation and OTP flow |
| `src/app/admin/components/UpdatePersonnel.tsx` | 552 | Extract field groups |
| `src/app/admin/components/ViewPersonnel.tsx` | 449 | Extract filter, list item, action menu |
| `src/app/admin/components/BulkUpload.tsx` | 445 | Extract CSV parsing, validation preview |
| `src/lib/categories/repository.ts` | 357 | May be acceptable as a DAL — review |
| `src/lib/categories/categoriesService.ts` | 344 | Review after fragmentation fix (#10) |
