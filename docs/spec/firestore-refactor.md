# Feature: Firestore Hybrid Architecture Refactor

## What Exists (Current State)

All Firestore reads AND writes use the **client SDK** (`db`, `auth` from `src/lib/firebase.ts`). There is no server-side Firebase Admin SDK wired up. This means:
- Firestore security rules are the only protection for writes
- No server-side validation beyond what runs in the browser
- Client has direct write access to all collections

Current service files doing client-side writes (from `docs/firebase-operations.md`):
- `src/lib/adminUtils.ts` — `authorized_personnel`, `users`, `admin_config`
- `src/lib/equipmentService.ts` — `equipment`, `equipmentTemplates`, `actionsLog`
- `src/lib/transferRequestService.ts` — `transferRequests`, `equipment`, `actionsLog`
- `src/lib/actionsLogService.ts` — `actionsLog`
- `src/lib/userService.ts` — `users`, `authorized_personnel`
- `src/lib/userDataService.ts` — `users`
- `src/lib/communicationService.ts` — `users`
- `src/lib/otpUtils.ts` — `otp_sessions`, `otp_rate_limits`
- `src/lib/categories/repository.ts` — `categories`, `subcategories`
- `src/utils/notifications.ts` — `notifications`

Current client-side real-time listeners:
- `src/contexts/NotificationContext.tsx` — `onSnapshot` on `notifications`
- `src/contexts/AuthContext.tsx` — `onAuthStateChanged`

## Target Architecture

**Hybrid pattern:**
- **Writes/Mutations:** Server-side via `firebase-admin` SDK, exposed as Next.js Server Actions
- **Reads/Real-time:** Client-side via Firebase Client SDK (`onSnapshot`, `getDocs`)

**Code structure:**

| Layer | Location | Purpose |
|-------|----------|---------|
| Core DB layer | `src/lib/db/` | Admin SDK init, generic helpers, converters |
| Server services | `src/lib/db/server/` | Domain services using `firebase-admin` for writes |
| Client hooks | `src/hooks/` | Real-time listeners and read queries via client SDK |
| Server Actions | `src/app/actions/` | Next.js Server Actions that call server services |
| Types + Converters | `src/types/` + `src/lib/db/converters/` | Shared types, Firestore `withConverter` |

## Migration Order (step-by-step, no regressions)

### Step 0: Infrastructure — Wire up `firebase-admin`
- **Blocker:** Service account key points to wrong project (`sayeret-givati` vs `sayeret-givati-1983`). Generate new key from Firebase console.
- Create `src/lib/db/admin.ts` — initialize admin app, export `adminDb`, `adminAuth`
- Create `src/lib/db/core.ts` — generic typed helpers (`getDocById<T>`, `createDoc<T>`, `updateDoc<T>`) for both admin and client
- Create `src/lib/db/collections.ts` — central collection name constants (consolidates scattered constants flagged in `docs/duplications.md`)
- Status: ✅ Done

### Step 1: `actionsLog` — Simple write-only (prove the pattern)
- Create converter: `src/lib/db/converters/actionsLog.ts`
- Create server service: `src/lib/db/server/actionsLogService.ts`
- Create Server Action: `src/app/actions/actionsLog.ts`
- Migrate callers from `src/lib/actionsLogService.ts` → Server Action
- Keep client-side reads (query functions) as-is
- Status: ✅ Done

### Step 2: `categories` / `subcategories` — Simple CRUD
- Server service: `src/lib/db/server/categoriesService.ts`
- API routes: `src/app/api/categories/route.ts`, `src/app/api/categories/subcategories/route.ts`
- Updated: `src/lib/categories/repository.ts` — write methods call API routes
- Status: ✅ Done

### Step 3: `equipmentTemplates` — CRUD with permissions
- Server service: `src/lib/db/server/equipmentTemplatesService.ts`
- API route: `src/app/api/equipment-templates/route.ts`
- Updated: `src/lib/equipmentService.ts` — `EquipmentTypesService` write methods call API routes
- Status: ✅ Done

### Step 4: `authorized_personnel` — CRUD + batch
- Server service: `src/lib/db/server/authorizedPersonnelService.ts`
- API routes: `src/app/api/authorized-personnel/route.ts`, `src/app/api/authorized-personnel/bulk/route.ts`
- Updated: `src/lib/adminUtils.ts` — `AdminFirestoreService` write methods call API routes, `syncAuthorizedPersonnelToUser` moved to server
- Status: ✅ Done

### Step 5: `users` — Registration + profile updates
- Server service: `src/lib/db/server/userService.ts`
- API route: `src/app/api/auth/create-profile/route.ts`
- Updated: `src/lib/userService.ts` — `registerUser` writes via API route, `markAsRegistered` moved to server
- `CommunicationService` — no callers, left as-is (will delete when confirmed)
- Status: ✅ Done

### Step 6: `equipment` — CRUD + transactions
- Server service: `src/lib/db/server/equipmentService.ts` — create (transaction with actionsLog), update, transfer
- API routes: `src/app/api/equipment/route.ts` (POST/PUT), `src/app/api/equipment/transfer/route.ts` (POST)
- Updated: `src/lib/equipmentService.ts` — `EquipmentItemsService` write methods call API routes
- Status: ✅ Done

### Step 7: `transferRequests` — Full approval workflow + real-time
- Server service: `src/lib/db/server/transferRequestService.ts` — create/approve/reject (all transactional with equipment + actionsLog)
- API routes: `src/app/api/transfer-requests/route.ts`, `/approve/route.ts`, `/reject/route.ts`
- Updated: `src/lib/transferRequestService.ts` — write methods call API routes
- Updated: `src/components/equipment/TransferModal.tsx` — removed separate `createActionLog` call (server handles it)
- Approve/reject API routes ready for when approval UI is built
- `usePendingTransfers` hook with `onSnapshot` — deferred to approval UI task
- Status: ✅ Done

### Step 8: `notifications` — Server writes + client real-time
- Server service: `src/lib/db/server/notificationService.ts` — create, batch create, markRead, markAllRead, delete
- API routes: `src/app/api/notifications/route.ts` (POST/DELETE), `src/app/api/notifications/read/route.ts` (PUT/POST)
- Updated: `src/contexts/NotificationContext.tsx` — markAsRead/markAllAsRead/deleteNotification now call API routes
- Updated: `src/lib/db/server/transferRequestService.ts` — notification creation moved into server transfer functions (create/approve/reject)
- Updated: `src/lib/transferRequestService.ts` — removed client-side `setTimeout` notification calls
- `onSnapshot` listener in `NotificationContext` stays client-side (reads)
- Status: ✅ Done

### Step 9: `otp_sessions` / `otp_rate_limits` — Server-only
- Server service: `src/lib/db/server/otpService.ts` — full OTP management using admin SDK
- Updated: `src/app/api/auth/send-otp/route.ts` — imports from server OTP service
- Updated: `src/app/api/auth/verify-otp/route.ts` — imports from server OTP service
- Original `src/lib/otpUtils.ts` preserved but no longer used by API routes
- Status: ✅ Done

### Migration Complete
All 12 Firestore collections now have server-side writes via `firebase-admin`:
- `actionsLog`, `categories`, `subcategories`, `equipmentTemplates`, `authorized_personnel`
- `users`, `equipment`, `transferRequests`, `notifications`, `otp_sessions`, `otp_rate_limits`
- Only `admin_config` remains read-only (no writes needed)

## Design Decisions

- **No generic CRUD abstraction for transactions.** Complex operations (transfer approval = update transfer + update equipment + create action log + send notification) stay as explicit domain methods. Generic layer is only for simple single-document operations.
- **Converters built per-domain** as each step is migrated, not all upfront.
- **Each step must pass `npm run build`** before moving to the next. No partial migrations.
- **Old service files deleted** after migration — no backward compatibility wrappers.
- **Documentation updated** after each step — per-file docs, `firebase-operations.md`, and this spec.

## Verification (per step)

1. `npm run build` passes
2. Feature works end-to-end (manual test)
3. Old client-side write code removed
4. Docs updated
