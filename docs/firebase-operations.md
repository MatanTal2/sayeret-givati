# Firebase Operations

All Firestore operations in the codebase, organized by collection.

**SDK:** Firebase Client SDK (`db` from `src/lib/firebase.ts`). No Admin SDK is wired up yet — see infra blocker in `CLAUDE.md`.

> **Duplication note:** Collection names are defined as local constants or hardcoded strings per-service file. They should be consolidated — see `docs/duplications.md` items #4 and #5.

---

## Collection Map

| Collection | Constant / String | Defined in |
|------------|------------------|------------|
| `users` | `ADMIN_CONFIG.FIRESTORE_USERS_COLLECTION` | `src/constants/admin.ts` |
| `authorized_personnel` | `ADMIN_CONFIG.FIRESTORE_PERSONNEL_COLLECTION` | `src/constants/admin.ts` |
| `equipment` | `EQUIPMENT_COLLECTION = 'equipment'` | `src/lib/equipmentService.ts`, `src/lib/transferRequestService.ts` (duplicate) |
| `equipmentTemplates` | `EQUIPMENT_TEMPLATES_COLLECTION = 'equipmentTemplates'` | `src/lib/equipmentService.ts` |
| `transferRequests` | `TRANSFER_REQUESTS_COLLECTION = 'transferRequests'` | `src/lib/transferRequestService.ts` |
| `actionsLog` | `ACTIONS_LOG_COLLECTION = 'actionsLog'` | `src/lib/actionsLogService.ts` |
| `notifications` | `NOTIFICATIONS_COLLECTION = 'notifications'` | `src/utils/notifications.ts` (hardcoded string in `NotificationContext`) |
| `categories` | `COLLECTIONS.CATEGORIES = 'categories'` | `src/lib/categories/constants.ts` |
| `subcategories` | `COLLECTIONS.SUBCATEGORIES = 'subcategories'` | `src/lib/categories/constants.ts` |
| `admin_config` | hardcoded `'admin_config'` | `src/lib/adminUtils.ts` |
| `test` | hardcoded `'test'` | `src/app/test-dashboard/page.tsx` (dev only) |
| `actionsLog` | hardcoded `'actionsLog'` | `src/lib/equipmentService.ts` (should import from actionsLogService) |
| `users` | hardcoded `'users'` | `src/lib/userService.ts` (should use ADMIN_CONFIG constant) |
| `announcements` | `COLLECTIONS.ANNOUNCEMENTS = 'announcements'` | `src/lib/db/collections.ts` |
| `useful_links` | `COLLECTIONS.USEFUL_LINKS = 'useful_links'` | `src/lib/db/collections.ts` |
| `unit_media` | `COLLECTIONS.UNIT_MEDIA = 'unit_media'` | `src/lib/db/collections.ts` |
| `ammunitionTemplates` | `COLLECTIONS.AMMUNITION_TEMPLATES = 'ammunitionTemplates'` | `src/lib/db/collections.ts` (Phase 2 — see `docs/spec/ammunition-feature.md`) |
| `ammunition` | `COLLECTIONS.AMMUNITION = 'ammunition'` | `src/lib/db/collections.ts` (Phase 3) |
| `ammunitionInventory` | `COLLECTIONS.AMMUNITION_INVENTORY = 'ammunitionInventory'` | `src/lib/db/collections.ts` (Phase 3) |
| `ammunitionReports` | `COLLECTIONS.AMMUNITION_REPORTS = 'ammunitionReports'` | `src/lib/db/collections.ts` (Phase 4 — server: `src/lib/db/server/ammunitionReportsService.ts`; client: `src/lib/ammunition/reportsService.ts`) |
| `ammunitionReportRequests` | `COLLECTIONS.AMMUNITION_REPORT_REQUESTS = 'ammunitionReportRequests'` | `src/lib/db/collections.ts` (Phase 6 — server: `src/lib/db/server/ammunitionReportRequestService.ts`) |
| `systemConfig` | `COLLECTIONS.SYSTEM_CONFIG = 'systemConfig'` | `src/lib/db/collections.ts` (Phase 1 — `ammoNotificationRecipientUserId`) |

---

## `announcements`

Unit-wide announcements shown on the home page.

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/announcementsService.ts` | `getRecentAnnouncements` | `getDocs` | `orderBy('createdAt', 'desc')`, `limit(n)` |

### Writes

| File | Function | Operation | Notes |
|------|----------|-----------|-------|
| `src/lib/announcementsService.ts` | `createAnnouncement` | `addDoc` | Client SDK. Rule allows admin/officer/commander only |
| `src/lib/announcementsService.ts` | `deleteAnnouncement` | `deleteDoc` | Client SDK. Same role gate |

### Security rules

`firestore.rules`:
- `read` — any authenticated user
- `create` / `delete` — user doc's `userType == 'admin'` OR `role` ∈ {`officer`, `commander`}
- `update` — not allowed

---

## `useful_links`

Admin-curated quick links rendered as chips on the home page.

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/usefulLinksService.ts` | `getUsefulLinks` | `getDocs` | `orderBy('order', 'asc')` |

### Writes

Not exposed via the app. Admins seed entries manually from the Firestore console until an admin CRUD UI ships.

### Security rules

`firestore.rules`:
- `read` — any authenticated user
- `write` — denied (seeded via console)

---

## `unit_media`

Unit photos and videos shown on the home page media gallery.

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/unitMediaService.ts` | `getRecentUnitMedia` | `getDocs` | `orderBy('createdAt', 'desc')`, `limit(n)` |

### Writes

Not exposed via the app. Admins seed entries manually from the Firestore console until an admin upload UI ships.

### Security rules

`firestore.rules`:
- `read` — any authenticated user
- `write` — denied (seeded via console)

---

## `users`

**Document ID:** Firebase Auth UID

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/userDataService.ts` | `fetchUserDataByUid` | `getDoc` | Direct doc by UID |
| `src/lib/userDataService.ts` | `getUserByEmail` | `getDocs` | `where('email', '==', email)` |
| `src/lib/adminUtils.ts` | `deleteUserByMilitaryHash` | `getDocs` | `where('militaryPersonalNumber', '==', hash)` |
| `src/hooks/useUsers.ts` | `useUsers` hook | `getDocs` | All users (no filter) |
| `src/app/test-dashboard/page.tsx` | `testUserAccess` | `getDoc` | Direct doc by UID |

### Writes

| File | Function | Operation | Fields changed |
|------|----------|-----------|----------------|
| `src/lib/userService.ts` | `registerUser` | `setDoc` | Full user profile on registration |
| `src/lib/adminUtils.ts` | `deleteUserByMilitaryHash` | `updateDoc` | `isDeleted: true`, `deletedAt` |
| `src/lib/communicationService.ts` | `updateCommunicationPreferences` | `updateDoc` | `communicationPreferences.*` |
| `src/components/SimpleUserTest.tsx` | `handleCreateTestUser` | `setDoc` | Test user profile |
| `src/components/SimpleUserTest.tsx` | `handleDeleteTestUser` | `deleteDoc` | Removes test user document |

---

## `authorized_personnel`

**Document ID:** SHA-256 hash of military personal number

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/userService.ts` | `getAuthorizedPersonnelData` | `getDoc` | Direct doc by military ID hash |
| `src/lib/adminUtils.ts` | `isPersonnelRegistered` | `getDoc` | Direct doc by military ID hash |
| `src/lib/adminUtils.ts` | `getAllAuthorizedPersonnel` | `getDocs` | All documents |
| `src/lib/adminUtils.ts` | `getAllPersonnelWithRegistrationStatus` | `getDocs` | All documents |
| `src/app/api/auth/verify-military-id/route.ts` | `POST` handler | `getDoc` | Direct doc by military ID hash |

### Writes

| File | Function | Operation | Fields changed |
|------|----------|-----------|----------------|
| `src/lib/adminUtils.ts` | `addAuthorizedPersonnel` | `setDoc` | Full personnel entry |
| `src/lib/adminUtils.ts` | `addAuthorizedPersonnelBulk` | `writeBatch → batch.set` | Full personnel entries (batched up to 100) |
| `src/lib/adminUtils.ts` | `deleteAuthorizedPersonnelById` | `deleteDoc` | Removes document |
| `src/lib/adminUtils.ts` | `updatePersonnelRegistrationStatus` | `updateDoc` | `isRegistered`, `registeredAt`, `userId` |
| `src/lib/userService.ts` | `markPersonnelAsRegistered` | `updateDoc` | `isRegistered: true`, `registeredAt`, `userId` |

---

## `equipment`

**Document ID:** Serial number (מספר סידורי)

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/equipmentService.ts` | `getEquipmentById` | `getDoc` | Direct doc by serial number |
| `src/lib/equipmentService.ts` | `listEquipment` | `getDocs` | Dynamic multi-filter query (holderId, unit, status, category, equipmentType); `orderBy('updatedAt', 'desc')` |
| `src/lib/transferRequestService.ts` | `createTransferRequest` (transaction) | `getDoc` (in transaction) | Direct doc — verify equipment exists |
| `src/lib/transferRequestService.ts` | `approveTransferRequest` (transaction) | `getDoc` (in transaction) | Direct doc — read before updating holder |
| `src/lib/transferRequestService.ts` | `rejectTransferRequest` (transaction) | `getDoc` (in transaction) | Direct doc — read for notification |

### Writes

| File | Function | Operation | Fields changed |
|------|----------|-----------|----------------|
| `src/lib/equipmentService.ts` | `addEquipmentItem` (transaction) | `setDoc` in transaction | Full equipment document |
| `src/lib/equipmentService.ts` | `updateEquipment` | `updateDoc` | Arbitrary fields (passed as partial) + `updatedAt` |
| `src/lib/equipmentService.ts` | `updateEquipmentStatus` | `updateDoc` | `status`, `updatedAt`, `trackingHistory` |
| `src/lib/equipmentService.ts` | `importEquipmentFromTemplates` | `writeBatch → batch.set` | Full documents for each imported item |
| `src/lib/transferRequestService.ts` | `approveTransferRequest` (transaction) | `updateDoc` in transaction | `currentHolder`, `currentHolderId`, `updatedAt`, `trackingHistory` |
| `src/lib/transferRequestService.ts` | `rejectTransferRequest` (transaction) | `updateDoc` in transaction | Status fields rollback |
| `src/hooks/useEquipment.ts` | `approveEquipment` | `updateDoc` | `status`, `approvedBy`, `approvedAt` |
| `src/hooks/useEquipment.ts` | `updateDailyReport` | `updateDoc` | `lastReportUpdate`, `dailyStatusChecked` |

---

## `equipmentTemplates`

**Document ID:** Auto-generated

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/equipmentService.ts` | `getTemplates` | `getDocs` | All templates |
| `src/lib/equipmentService.ts` | `getEquipmentTypes` | `getDocs` | `orderBy('sortOrder'), orderBy('name')` |
| `src/app/test-dashboard/page.tsx` | `testEquipmentTemplates` | `getDoc` | Direct doc by ID |

### Writes

| File | Function | Operation | Fields changed |
|------|----------|-----------|----------------|
| `src/lib/equipmentService.ts` | `createEquipmentType` | `setDoc` | Full template document |
| `src/lib/equipmentService.ts` | `updateEquipmentType` | `updateDoc` | Arbitrary fields + `updatedAt` |

---

## `transferRequests`

**Document ID:** Auto-generated

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/transferRequestService.ts` | `approveTransferRequest` (transaction) | `getDoc` in transaction | Direct doc by transfer request ID |
| `src/lib/transferRequestService.ts` | `rejectTransferRequest` (transaction) | `getDoc` in transaction | Direct doc by transfer request ID |
| `src/lib/transferRequestService.ts` | `getTransferRequestsForUser` | `getDocs` | `where('requesterId', '==', userId)` or `where('currentHolderId', '==', userId)`, `orderBy('createdAt', 'desc')` |
| `src/lib/transferRequestService.ts` | `getPendingTransferRequests` | `getDocs` | `where('status', '==', 'pending')`, `orderBy('createdAt', 'desc')` |
| `src/lib/transferRequestService.ts` | `getTransferRequestsByEquipment` | `getDocs` | `where('equipmentDocId', '==', equipmentId)`, `orderBy('createdAt', 'desc')` |

### Writes

| File | Function | Operation | Fields changed |
|------|----------|-----------|----------------|
| `src/lib/transferRequestService.ts` | `createTransferRequest` (transaction) | `addDoc` | Full transfer request document |
| `src/lib/transferRequestService.ts` | `approveTransferRequest` (transaction) | `updateDoc` in transaction | `status: 'approved'`, `approvedBy`, `approvedAt`, `updatedAt` |
| `src/lib/transferRequestService.ts` | `rejectTransferRequest` (transaction) | `updateDoc` in transaction | `status: 'rejected'`, `rejectedBy`, `rejectedAt`, `rejectionReason`, `updatedAt` |

---

## `actionsLog`

**Document ID:** Auto-generated

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/actionsLogService.ts` | `getActionLogsByEquipment` | `getDocs` | `where('equipmentDocId', '==', id)`, `orderBy('timestamp', 'desc')`, `limit(N)` |
| `src/lib/actionsLogService.ts` | `getActionLogsByType` | `getDocs` | `where('actionType', '==', type)`, `orderBy('timestamp', 'desc')`, `limit(N)` |
| `src/lib/actionsLogService.ts` | `getActionLogsByActor` | `getDocs` | `where('actorId', '==', uid)`, `orderBy('timestamp', 'desc')`, `limit(N)` |
| `src/lib/actionsLogService.ts` | `getRecentActionLogs` | `getDocs` | `orderBy('timestamp', 'desc')`, `limit(N)` |
| `src/lib/actionsLogService.ts` | `getActionLogsByTimeRange` | `getDocs` | `where('timestamp', '>=', start)`, `where('timestamp', '<=', end)`, `orderBy('timestamp', 'desc')` |

### Writes

| File | Function | Operation | Fields changed |
|------|----------|-----------|----------------|
| `src/lib/actionsLogService.ts` | `createActionLog` | `addDoc` | Full log entry with timestamp |
| `src/lib/equipmentService.ts` | `addEquipmentItem` (transaction) | `setDoc` in transaction | Log entry for equipment creation |

> Note: `src/lib/equipmentService.ts` writes directly to `actionsLog` using a hardcoded string `'actionsLog'` instead of importing from `actionsLogService`. This is a duplication — see `docs/duplications.md`.

---

## `notifications`

**Document ID:** Auto-generated

### Reads (+ Real-time listener)

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/contexts/NotificationContext.tsx` | `NotificationProvider` | `onSnapshot` | `where('userId', '==', uid)`, `orderBy('createdAt', 'desc')` — **real-time listener** |
| `src/utils/notifications.ts` | `getNotifications` | `getDocs` | `where('userId', '==', uid)` + optional `isRead`, `type` filters, `limit(N)` |
| `src/utils/notifications.ts` | `cleanupOldNotifications` | `getDocs` | `where('userId', '==', uid)`, `orderBy('createdAt', 'desc')`, `limit(150)` |

### Writes

| File | Function | Operation | Fields changed |
|------|----------|-----------|----------------|
| `src/utils/notifications.ts` | `NotificationService.create` | `addDoc` | Full notification document |
| `src/utils/notifications.ts` | `markAsRead` | `updateDoc` | `isRead: true`, `readAt` |
| `src/utils/notifications.ts` | `markAllAsRead` | `updateDoc` (per doc) | `isRead: true`, `readAt` — batched over query results |
| `src/utils/notifications.ts` | `deleteNotification` | `deleteDoc` | Removes document |
| `src/utils/notifications.ts` | `cleanupOldNotifications` | `deleteDoc` (per doc) | Removes documents beyond 150-item limit |

---

## `categories`

**Document ID:** Auto-generated

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/categories/repository.ts` | `getCategories` | `getDocs` | All, or `where('isActive', '==', true)` |
| `src/lib/categories/repository.ts` | `deactivateCategory` | `getDocs` | `where('categoryId', '==', id)` for related subcategories |

### Writes

| File | Function | Operation | Fields changed |
|------|----------|-----------|----------------|
| `src/lib/categories/repository.ts` | `createCategory` | `setDoc` | Full category document with `serverTimestamp()` |
| `src/lib/categories/repository.ts` | `updateCategory` | `updateDoc` | Arbitrary fields + `updatedAt` |
| `src/lib/categories/repository.ts` | `deactivateCategory` | `writeBatch → batch.update` | `isActive: false`, `updatedAt` on category and all subcategories |

---

## `subcategories`

**Document ID:** Auto-generated

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/categories/repository.ts` | `getSubcategories` | `getDocs` | All, or `where('isActive', '==', true)`, optionally `where('categoryId', '==', id)` |

### Writes

| File | Function | Operation | Fields changed |
|------|----------|-----------|----------------|
| `src/lib/categories/repository.ts` | `createSubcategory` | `setDoc` | Full subcategory document |
| `src/lib/categories/repository.ts` | `updateSubcategory` | `updateDoc` | Arbitrary fields + `updatedAt` |
| `src/lib/categories/repository.ts` | `deactivateCategory` | `writeBatch → batch.update` | `isActive: false`, `updatedAt` (cascades from category deactivation) |

---

## ~~`otp_sessions`~~ (removed)

OTP session storage was deleted with the Twilio → Firebase Phone Auth migration. Firebase manages the verification lifecycle in-memory via `ConfirmationResult` (no Firestore collection involved). See `docs/spec/firebase-otp-migration.md`.

---

## `admin_config`

**Document ID:** Fixed (known key, hardcoded in `adminUtils.ts`)

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/adminUtils.ts` | `getAdminConfig` | `getDoc` | Direct doc |

### Writes

None currently — admin config is read-only at runtime.

---

## `ammunitionReports` *(Ammunition Phase 4)*

**Document ID:** Auto-generated.

### Reads

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/ammunitionReportsService.ts` | `serverListAmmunitionReports` | filtered query (admin SDK) — usedAt range, teamId, reporterId, templateId; orderBy usedAt desc |
| `src/lib/ammunition/reportsService.ts` | `listAmmunitionReports` | filtered query (client SDK), same filters |

### Writes

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/ammunitionReportsService.ts` | `serverSubmitAmmunitionReport` | Runs a single Firestore transaction — write the report, decrement inventory or flip SERIAL items to CONSUMED. Reads `users/{reporterUid}`, `users where teamId+userType==TL`, `systemConfig/main`, then fans out notifications (non-transactional). |

### API gates

`POST /api/ammunition-reports` — Phase 4 ships self-report only; the
transaction's holder check is the source of truth.

`GET /api/ammunition-reports` — open to any authenticated caller for now;
Phase 8 will tighten to manager+ + the responsible manager.

### Side effects

- `actionsLog` — single `AMMO_REPORT_SUBMITTED` entry per submission.
- `notifications` — fan out to TL(s) of the reporter's team plus the user
  configured at `systemConfig/main.ammoNotificationRecipientUserId`. The
  reporter is excluded; recipients are deduped.

---

## `ammunitionReportRequests` *(Ammunition Phase 6)*

**Document ID:** Auto-generated.

### Reads

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/ammunitionReportRequestService.ts` | `serverListAmmunitionReportRequests` | collection scan (admin SDK) |
| `src/app/api/ammunition-report-requests/route.ts` (GET) | (route handler) | invokes the list service |

### Writes

| File | Function | Operation | Notes |
|------|----------|-----------|-------|
| `src/lib/db/server/ammunitionReportRequestService.ts` | `serverCreateAmmunitionReportRequest` | `set` | Materializes `targetUserIds` from `users` for TEAM/ALL. Side effects: `actionsLog` + `notifications` (with `relatedEquipmentDocId = request.id`). |
| `src/lib/db/server/ammunitionReportRequestService.ts` | `serverCancelAmmunitionReportRequest` | `update status='CANCELED'` | — |
| `src/lib/db/server/ammunitionReportRequestService.ts` | `serverPatchFulfillment` | transactional `update` | Called from `serverSubmitAmmunitionReport` when the report carries a `reportRequestId`. Closes the request when all targets are fulfilled. |

### API gates

`/api/ammunition-report-requests` requires manager+ or team_leader for POST
and PATCH. Phase 8 will add Firestore rules to match.

---

## `ammunitionInventory` *(Ammunition Phase 3)*

**Document ID:** Deterministic — `${holderType}_${holderId}_${templateId}`.
The format is chosen so `set(merge)` is idempotent and a holder/template
combination always points to the same doc.

Holds BRUCE + LOOSE_COUNT stock. SERIAL items live in the `ammunition`
collection instead.

### Reads

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/ammunitionInventoryService.ts` | `serverListAmmunitionStock` | collection scan (admin SDK) |
| `src/lib/ammunition/inventoryService.ts` | `listAmmunitionStock` | collection scan (client SDK) |

### Writes

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/ammunitionInventoryService.ts` | `serverUpsertAmmunitionStock` | `set(merge)`. First write stamps `createdBy`. |
| `src/lib/db/server/ammunitionInventoryService.ts` | `serverDeleteAmmunitionStock` | `delete` after permission re-check |

### API gates

`POST /api/ammunition-inventory` (kind=stock) and `DELETE
/api/ammunition-inventory/[id]` (kind=stock) gate via
`canMutateAmmunitionInventory`.

---

## `ammunition` *(Ammunition Phase 3)*

**Document ID:** Serial number (צ). One doc per item.

### Reads

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/ammunitionInventoryService.ts` | `serverListSerialItems` | collection scan (admin SDK) |
| `src/lib/ammunition/inventoryService.ts` | `listSerialAmmunitionItems` | collection scan (client SDK) |

### Writes

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/ammunitionInventoryService.ts` | `serverCreateSerialItem` | `set` — rejects duplicates and non-SERIAL templates |
| `src/lib/db/server/ammunitionInventoryService.ts` | `serverUpdateSerialItem` | `update` — re-checks permission against both old and new holder |
| `src/lib/db/server/ammunitionInventoryService.ts` | `serverDeleteSerialItem` | `delete` after permission re-check |

### API gates

`/api/ammunition-inventory` (kind=item) for create/update/delete. Permission
matrix mirrors `ammunitionInventory`.

---

## `ammunitionTemplates` *(Ammunition Phase 2)*

**Document ID:** Auto-generated. `id` field stored on the doc as well for
client convenience.

Backed by `src/types/ammunition.ts → AmmunitionType`. Statuses: `CANONICAL`
(approved unit-standard), `PROPOSED` (TL), `PENDING_REQUEST` (user — Phase 5).

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/db/server/ammunitionTemplatesService.ts` | `serverListAmmunitionTemplates` | `get` | Collection scan (admin SDK) |
| `src/lib/ammunition/templatesService.ts` | `listAmmunitionTemplates` | `getDocs` | Collection scan (client SDK) |
| `src/app/api/ammunition-templates/route.ts` (GET) | (route handler) | invokes `serverListAmmunitionTemplates` | — |

### Writes

| File | Function | Operation | Notes |
|------|----------|-----------|-------|
| `src/lib/db/server/ammunitionTemplatesService.ts` | `serverCreateAmmunitionTemplate` | `set` | Auto-id; computes `totalBulletsPerBruce` for BRUCE templates |
| `src/lib/db/server/ammunitionTemplatesService.ts` | `serverUpdateAmmunitionTemplate` | `update` | Recomputes `totalBulletsPerBruce` when both BRUCE constants are present |
| `src/lib/db/server/ammunitionTemplatesService.ts` | `serverDeleteAmmunitionTemplate` | `delete` | — |
| `src/lib/db/server/ammunitionTemplatesService.ts` | `serverSeedCanonicalAmmunitionTemplates` | batch `set` | Idempotent on `name` against existing `status == 'CANONICAL'` docs |

### API gates

- POST/PUT/DELETE require admin/system_manager/manager.
- TL may POST with `status: 'PROPOSED'`; CANONICAL is admin/manager only.
- `seed_canonical` action is admin/manager only.

### Security rules

Not yet deployed. Phase 8 will add Firestore rules. The API route is the gate
today.

---

## `systemConfig` *(Ammunition Phase 1)*

**Document ID:** Fixed — single doc with id `main`. There is exactly one system-config document.

Backed by `src/types/ammunition.ts → SystemConfig`. Phase 1 ships only one
field: `ammoNotificationRecipientUserId` (the user who is CC'd on every
ammunition report submission). Future phases may add more system-wide flags.

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/db/server/systemConfigService.ts` | `serverGetSystemConfig` | `get` | Direct doc `systemConfig/main` (admin SDK) |
| `src/app/api/system-config/route.ts` (GET) | (route handler) | invokes `serverGetSystemConfig` | — |
| `src/hooks/useSystemConfig.ts` | `refresh` | `fetch GET /api/system-config` | — |

### Writes

| File | Function | Operation | Notes |
|------|----------|-----------|-------|
| `src/lib/db/server/systemConfigService.ts` | `serverUpdateSystemConfig` | `set(..., { merge: true })` | Stamps `updatedAt`/`updatedBy`. Doc is created on first save. |
| `src/app/api/system-config/route.ts` (PUT) | (route handler) | invokes service after admin gate | Rejects non-admin/non-system_manager actors with 403 |

### Security rules

Not yet deployed for this collection. The API route is the gate — `PUT` requires
`UserType.ADMIN` or `UserType.SYSTEM_MANAGER`. Phase 8 will add a Firestore rule
mirroring this so direct client SDK reads/writes are also locked down.

---

## `retirementRequests` *(Phase 4)*

**Document ID:** Auto-generated

### Reads

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/retirementRequestService.ts` | `getPendingRetirementRequestsForHolder` | `getDocs` (`holderUserId == uid`, `status == 'pending'`) |
| `src/lib/retirementRequestService.ts` | `getRetirementRequestsBySigner` | `getDocs` (`signerUserId == uid`) |
| `src/lib/retirementRequestService.ts` | `getAllPendingRetirementRequests` | `getDocs` |

### Writes (admin SDK)

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/equipmentService.ts` | `serverRetireEquipment` | `set` retirementRequests + `update` equipment (in one txn) |
| `src/lib/db/server/retirementRequestService.ts` | `serverApproveRetirementRequest` | `update` retirementRequests + `update` equipment (status=RETIRED) in txn |
| `src/lib/db/server/retirementRequestService.ts` | `serverRejectRetirementRequest` | `update` retirementRequests in txn |

### API routes

- `POST /api/equipment/retire`
- `POST /api/retirement-requests/approve`
- `POST /api/retirement-requests/reject`

---

## `reportRequests` *(Phase 4)*

**Document ID:** Auto-generated

### Reads

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/reportRequestService.ts` | `getPendingReportRequestsForUser` | `getDocs` (`targetUserIds array-contains uid`, `status in [...]`) |
| `src/lib/reportRequestService.ts` | `getReportRequestsByRequester` | `getDocs` (`requestedByUserId == uid`) |

### Writes (admin SDK)

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/reportRequestService.ts` | `serverCreateReportRequest` | `set` + batch notifications to every target |
| `src/lib/db/server/reportRequestService.ts` | `serverFulfillReportRequest` | `update` in txn (per-user fulfillment + status roll-up) |

### API routes

- `POST /api/report-requests`
- `POST /api/report-requests/fulfill`

---

## `equipmentDrafts` *(Phase 4)*

**Document ID:** Auto-generated

### Reads

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/equipmentDraftService.ts` | `getDraftsForUser` | `getDocs` |
| `src/lib/equipmentDraftService.ts` | `getDraft` | `getDoc` |

### Writes (admin SDK)

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/equipmentDraftService.ts` | `serverCreateEquipmentDraft` | `set` |
| `src/lib/db/server/equipmentDraftService.ts` | `serverUpdateEquipmentDraft` | `update` |
| `src/lib/db/server/equipmentDraftService.ts` | `serverDeleteEquipmentDraft` | `delete` |
| `src/lib/db/server/equipmentDraftService.ts` | `serverPromoteDraftsForTemplate` | batched `update` on template approval |

### API routes

- `POST \| PUT \| DELETE /api/equipment-drafts`

---

## Phase 4 additions to existing collections

### `equipment` — new writes

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/equipmentService.ts` | `serverCreateEquipmentBatch` (txn) | N-item `set` + N `actionsLog` entries + shared `batchId` |
| `src/lib/db/server/equipmentService.ts` | `serverReportEquipment` (txn) | `update` (`lastReportUpdate`, `lastReportPhotoUrl`, tracking history) |
| `src/lib/db/server/equipmentService.ts` | `serverRetireEquipment` (txn) | `update` status → RETIRED when signer==holder |
| `src/lib/db/server/forceOpsService.ts` | `serverForceOps` (txn) | Bulk `update` of holder/signer + denormalized team/unit |

### `equipmentTemplates` — new writes

| File | Function | Operation |
|------|----------|-----------|
| `src/lib/db/server/templateRequestService.ts` | `serverProposeTemplate` | `set` (status=`proposed`\|`pending_request`), optional atomic draft `set` |
| `src/lib/db/server/templateRequestService.ts` | `serverApproveTemplateRequest` | `update` (→ `canonical`, `isActive=true`) + draft promotion |
| `src/lib/db/server/templateRequestService.ts` | `serverRejectTemplateRequest` | `update` (→ `rejected`, `rejectedReason`) |

### New API routes (summary)

`/api/equipment/batch`, `/api/equipment/report`, `/api/equipment/retire`, `/api/equipment-templates/{propose,approve,reject}`, `/api/retirement-requests/{approve,reject}`, `/api/report-requests`, `/api/report-requests/fulfill`, `/api/equipment-drafts`, `/api/force-ops`.

Every route that mutates equipment state gates via `src/lib/equipmentPolicy.ts` using the client-supplied `actor` payload (see `src/lib/db/server/policyHelpers.ts`). Token verification is not yet wired — tracked in `docs/spec/firestore-refactor.md`.

---

## Phase 6 client reads (UI hooks)

| Surface | Function | Collection / query |
|---------|----------|---------------------|
| `useEquipment` (`src/hooks/useEquipment.ts`) | `EquipmentService.Items.getEquipmentList` | `equipment` (no filter; client-side scope+policy filter via `equipmentPolicy.canView`) |
| `ActionHistoryPanel` | `getEquipmentActionLogs(id)` | `actionsLog where equipmentDocId == id orderBy timestamp desc` |
| `AddEquipmentWizard` (resume) | `getDraftsForUser(uid)` + `getDraft(id)` + `EquipmentService.Types.getEquipmentType(id)` | `equipmentDrafts` per-user, `equipmentTemplates` by id |
| `WizardStepTemplate` | `CategoriesService.getCategories({ activeOnly, includeSubcategories })`, `EquipmentService.Types.getEquipmentTypes({ activeOnly })` | `categories` + `subcategories` + `equipmentTemplates` (filtered to `status=canonical` client-side) |

Photo uploads use Firebase Storage via `src/lib/storageService.ts`. Path layout: `equipment/{equipmentId}/{kind}/{timestamp}.jpg` where kind = `signup` | `report`. Compressed client-side before upload (max 1600 px longest edge, JPEG Q 0.82).

---

## Phase 7 management-tab reads

| Surface | Function | Collection / query |
|---------|----------|---------------------|
| `RetirementApprovalTab` | `getAllPendingRetirementRequests()` | `retirementRequests where status=='pending' orderBy createdAt desc` |
| `RetirementApprovalTab` (audit) | `getRecentDecidedRetirementRequests(limit)` | three queries — `status in {approved, rejected, cancelled}` — merged + sorted client-side |
| `ReportRequestTab` | `getReportRequestsByRequester(uid)` | `reportRequests where requestedByUserId == uid orderBy createdAt desc` |
| `ForceOperationsTab` (recent ops panel) | `getActionLogsByType(FORCE_TRANSFER_HOLDER)` × `getActionLogsByType(FORCE_TRANSFER_SIGNER)` merged | `actionsLog where actionType == ... orderBy timestamp desc` (twin queries) |
| `UserSearchInput` | `searchUsers(query, limit)` from `userService` | `users` filtered client-side on display fields (no composite index) |

### `serverCreateReportRequest` — Phase 8 update

When `targetUserIds` is empty AND scope is `team` or `all`, the server now resolves the user list from the `users` collection:

- `scope='team'` → `users where teamId == targetTeamId AND status == 'active'`
- `scope='all'` → `users where status == 'active'`

The client `ReportRequestTab` therefore passes empty `targetUserIds` for those scopes; only `user` and `items` scopes require the client to pre-resolve.

---

## `test` *(dev-only)*

**Document ID:** Auto-generated or fixed test keys

| File | Function | Operation | Notes |
|------|----------|-----------|-------|
| `src/app/test-dashboard/page.tsx` | Various test functions | `setDoc`, `deleteDoc` | Used only for Firebase connectivity testing. Not in production paths. |
