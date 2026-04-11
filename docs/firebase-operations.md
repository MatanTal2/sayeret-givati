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
| `otp_sessions` | `OTP_COLLECTION = 'otp_sessions'` | `src/lib/otpUtils.ts` |
| `admin_config` | hardcoded `'admin_config'` | `src/lib/adminUtils.ts` |
| `test` | hardcoded `'test'` | `src/app/test-dashboard/page.tsx` (dev only) |
| `actionsLog` | hardcoded `'actionsLog'` | `src/lib/equipmentService.ts` (should import from actionsLogService) |
| `users` | hardcoded `'users'` | `src/lib/userService.ts` (should use ADMIN_CONFIG constant) |

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

## `otp_sessions`

**Document ID:** Phone number (E.164 format)

### Reads

| File | Function | Operation | Query |
|------|----------|-----------|-------|
| `src/lib/otpUtils.ts` | `OTPService.verifyOTP` | `getDoc` | Direct doc by phone number |
| `src/lib/otpUtils.ts` | `OTPService.checkRateLimit` | `getDocs` | Query for recent attempts within 1-hour window |

### Writes

| File | Function | Operation | Fields changed |
|------|----------|-----------|----------------|
| `src/lib/otpUtils.ts` | `OTPService.storeOTP` | `setDoc` | OTP hash, expiry, attempt count, phone |
| `src/lib/otpUtils.ts` | `OTPService.incrementAttempts` | `updateDoc` | `attempts` counter |
| `src/lib/otpUtils.ts` | `OTPService.clearOTP` | `updateDoc` | `verified: true`, `verifiedAt` |

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

## `test` *(dev-only)*

**Document ID:** Auto-generated or fixed test keys

| File | Function | Operation | Notes |
|------|----------|-----------|-------|
| `src/app/test-dashboard/page.tsx` | Various test functions | `setDoc`, `deleteDoc` | Used only for Firebase connectivity testing. Not in production paths. |
