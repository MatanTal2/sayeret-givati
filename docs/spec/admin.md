# Feature: Admin Panel

## What Exists (Implemented)

A standalone admin control panel at `/admin` with its own authentication (email/password, separate from user auth). Admins manage the `authorized_personnel` collection — the pre-authorization list that gates user registration. Admins can add personnel individually, update records, view the full list with search/filter, bulk-upload via CSV, and view system statistics.

The admin page has its own auth hook (`useAdminAuth`) and its own login form (`AdminLogin.tsx`), completely separate from the main user auth flow.

**Primary page:** `src/app/admin/page.tsx` (35 lines — routes to login or dashboard)  
**Admin auth hook:** `src/hooks/useAdminAuth.ts` (213 lines)  
**Admin utilities:** `src/lib/adminUtils.ts` (880 lines ⚠️) — security, validation, Firestore CRUD for personnel, session management

---

## User Stories

### Admin Authentication
- As an admin, I can log in with email and password on a separate admin login form.  
  **Status:** ✅ Implemented (`AdminLogin.tsx`, `useAdminAuth.ts`)
- As an admin, my session persists for the configured TTL (`ADMIN_CONFIG.SESSION_DURATION_HOURS`).  
  **Status:** ✅ Implemented
- As an admin, I can log out and am redirected to the login form.  
  **Status:** ✅ Implemented

### Adding Personnel
- As an admin, I can add a single authorized person by entering their military personal number, name, rank, unit, and phone.  
  **Status:** ✅ Implemented (`AddPersonnel.tsx`)
- As an admin, I can bulk-upload personnel from a CSV file.  
  **Status:** ✅ Implemented (`BulkUpload.tsx`) — CSV parsed client-side, validated, then batch-written to Firestore
- As an admin, the military personal number is hashed (SHA-256) before storage.  
  **Status:** ✅ Implemented (`SecurityUtils.hashMilitaryId` in `adminUtils.ts`)

### Viewing Personnel
- As an admin, I can view a paginated list of all authorized personnel.  
  **Status:** ✅ Implemented (`ViewPersonnel.tsx`, 449 lines ⚠️)
- As an admin, I can search by name, rank, or unit within the personnel list.  
  **Status:** ✅ Implemented
- As an admin, I can see whether each person has registered.  
  **Status:** 🔄 Partial — `isRegistered` field exists in data but is not prominently shown in the list view (known bug in `docs/bugs.md`)

### Updating Personnel
- As an admin, I can update the details of an existing authorized person.  
  **Status:** 🔄 Partial — `UpdatePersonnel.tsx` (552 lines ⚠️) UI exists; `AdminWriteService.updateAuthorizedPersonnel` is partially implemented (known bug in `docs/bugs.md`)

### System Statistics
- As an admin, I can see metrics: total authorized personnel, registered users, unregistered personnel.  
  **Status:** ✅ Implemented (`SystemStats.tsx`)

---

## In-Progress / TODO

- **Update personnel:** The update form UI exists but the write service is only partially implemented.
- **`isRegistered` visibility:** The field is stored but not visible in the personnel list (known bug).
- **Name validation for `-` and `'`:** Bulk upload and single-add reject these characters (known bug).
- **Phone normalization:** Missing on input (known bug).
- **Delete personnel:** A delete function exists in `adminUtils.ts` (`deleteAuthorizedPersonnelById`) but it's unclear if it's wired to the UI.

---

## Screens / Routes Involved

| Screen | File |
|--------|------|
| Admin page router | `src/app/admin/page.tsx` |
| Admin layout | `src/app/admin/layout.tsx` |
| Login form | `src/app/admin/components/AdminLogin.tsx` |
| Main dashboard | `src/app/admin/components/AdminDashboard.tsx` |
| Add single person | `src/app/admin/components/AddPersonnel.tsx` |
| Update person | `src/app/admin/components/UpdatePersonnel.tsx` |
| View all personnel | `src/app/admin/components/ViewPersonnel.tsx` |
| CSV bulk upload | `src/app/admin/components/BulkUpload.tsx` |
| System statistics | `src/app/admin/components/SystemStats.tsx` |
| Admin auth hook | `src/hooks/useAdminAuth.ts` |
| Personnel CRUD hook | `src/hooks/usePersonnelManagement.ts` |
| All admin utilities | `src/lib/adminUtils.ts` |
