# Firestore Migration — Manual Test Plan (Steps 1-7)

Run each test after `npm run dev`. Check both the UI result and Firebase Console for the document.

---

## Step 1: actionsLog (server writes via `/api/actions-log`)

**Test 1.1 — Direct API test**
- Open browser console on any page
- Run:
```javascript
fetch('/api/actions-log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ actionType: 'test', equipmentId: 'TEST-001', equipmentDocId: 'TEST-001', equipmentName: 'Test Item', actorId: 'test-user', actorName: 'Test User' })
}).then(r => r.json()).then(console.log)
```
- Expected: `{ success: true, id: "..." }`
- Firebase Console: new doc in `actionsLog` with `createdAt` timestamp

**Test 1.2 — Via transfer flow (covered in Step 7 tests)**

---

## Step 2: categories / subcategories (server writes via `/api/categories`)

**Test 2.1 — Create category**
- Go to Equipment page → Add Equipment → Create Template → click "+" next to category dropdown
- Enter a new category name → Submit
- Expected: category appears in dropdown
- Firebase Console: new doc in `categories` collection with `createdAt`

**Test 2.2 — Create subcategory**
- Select the category created above → click "+" next to subcategory dropdown
- Enter a new subcategory name → Submit
- Expected: subcategory appears in dropdown
- Firebase Console: new doc in `subcategories` with correct `parentCategoryId`

---

## Step 3: equipmentTemplates (server writes via `/api/equipment-templates`)

**Test 3.1 — Create equipment template**
- Go to Equipment page → Add Equipment → Create New Template
- Fill: name, category, subcategory, toggle daily check
- Submit
- Expected: success message, template appears in template list
- Firebase Console: new doc in `equipmentTemplates` with `createdAt`

---

## Step 4: authorized_personnel (server writes via `/api/authorized-personnel`)

**Test 4.1 — Add single personnel**
- Go to Admin panel → Add Personnel tab
- Fill: military ID, first name, last name, rank, phone
- Submit
- Expected: green success message (NOT red cache message)
- Firebase Console: new doc in `authorized_personnel` (docId = hash)

**Test 4.2 — Bulk add (CSV)**
- Go to Admin panel → Bulk Upload tab
- Upload a CSV with 2-3 rows
- Expected: success message showing count added/duplicates/failed
- Firebase Console: new docs in `authorized_personnel`

**Test 4.3 — Delete personnel**
- Go to Admin panel → View Personnel tab
- Delete one entry
- Expected: success message, entry removed from list
- Firebase Console: doc deleted from `authorized_personnel`

**Test 4.4 — Update personnel**
- Go to Admin panel → Update Personnel tab
- Edit a field (e.g. rank) on an existing entry
- Expected: success message
- Firebase Console: doc updated with new field value + `updatedAt`

---

## Step 5: users (server writes via `/api/auth/create-profile`)

**Test 5.1 — Registration flow**
- This requires a full registration flow:
  1. Ensure an authorized_personnel entry exists (from Test 4.1)
  2. Go to the registration modal
  3. Enter military personal number → verify → fill details → submit
- Expected: Firebase Auth user created + `users` doc created + `authorized_personnel` marked `registered: true`
- Firebase Console: new doc in `users` (docId = Firebase Auth UID)

*Note: If you can't do a full registration, test the API directly:*
```javascript
fetch('/api/auth/create-profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userProfile: { uid: 'test-uid-123', email: 'test@test.com', firstName: 'Test', lastName: 'User', gender: 'male', birthday: '2000-01-01', phoneNumber: '0501234567', rank: 'soldier', userType: 'user', role: 'soldier', status: 'active', militaryPersonalNumberHash: 'test-hash', permissions: ['equipment:view'], communicationPreferences: {} },
    militaryIdHash: 'test-hash'
  })
}).then(r => r.json()).then(console.log)
```

---

## Step 6: equipment (server writes via `/api/equipment`)

**Test 6.1 — Create equipment**
- Go to Equipment page → Add Equipment
- Select a template (or manual entry)
- Fill: serial number, holder, unit, location
- Submit
- Expected: equipment appears in list
- Firebase Console: new doc in `equipment` AND new doc in `actionsLog` (both created atomically in transaction)

**Test 6.2 — Update equipment status**
- Click update on an existing equipment item
- Change status or condition
- Submit
- Expected: success message, status updated in list
- Firebase Console: `equipment` doc updated, `trackingHistory` array has new entry

---

## Step 7: transferRequests (server writes via `/api/transfer-requests`)

**Test 7.1 — Create transfer request**
- Go to Equipment page → click Transfer on an equipment item
- Search for a user, enter reason
- Submit
- Expected: success alert, equipment status changes to "Pending Transfer"
- Firebase Console: new doc in `transferRequests` (status=pending) + `equipment` doc status updated to `pending_transfer` + `trackingHistory` has new entry

**Test 7.2 — Approve transfer (API only — no UI yet)**
```javascript
fetch('/api/transfer-requests/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transferRequestId: '<ID from 7.1>', approverUserId: '<your-uid>', approverUserName: '<your-name>' })
}).then(r => r.json()).then(console.log)
```
- Expected: `{ success: true }`
- Firebase Console: `transferRequests` doc status = `approved`, `equipment` doc has new holder + status = `available` + new `actionsLog` entry

**Test 7.3 — Reject transfer (API only — no UI yet)**
- Create a new transfer request first (Test 7.1)
```javascript
fetch('/api/transfer-requests/reject', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transferRequestId: '<new ID>', rejectorUserId: '<your-uid>', rejectorUserName: '<your-name>', rejectionReason: 'Test rejection' })
}).then(r => r.json()).then(console.log)
```
- Expected: `{ success: true }`
- Firebase Console: `transferRequests` doc status = `rejected`, `equipment` doc status reverted to `available`

---

## Quick smoke test (all steps at once)

1. Add an authorized_personnel entry (Step 4) ✓
2. Create an equipment template (Step 3) ✓
3. Create an equipment item using that template (Step 6) ✓
4. Transfer that equipment to another user (Step 7) ✓
5. Check `actionsLog` has entries for creation and transfer (Step 1) ✓
6. Check `categories`/`subcategories` were created if you made a new template (Step 2) ✓

All writes should appear in Firebase Console via the Admin SDK — no client-side `addDoc`/`setDoc` calls in the network tab.
