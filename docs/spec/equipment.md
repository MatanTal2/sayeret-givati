# Feature: Equipment Management (צלם)

## What Exists (Implemented)

A military equipment tracking system at `/equipment`. Tracks serialized equipment items against a two-level model: `EquipmentType` (template in `equipmentTemplates` Firestore collection) defines the category/kind; `Equipment` (item in `equipment` Firestore collection) is a physical item with a serial number. Equipment can be assigned to holders, transferred between users, given a daily check-in, and tracked with full history.

**Primary page:** `src/app/equipment/page.tsx` (294 lines)  
**State hook:** `src/hooks/useEquipment.ts` (390 lines ⚠️)  
**Service:** `src/lib/equipmentService.ts` (725 lines ⚠️)  
**Utilities:** `src/lib/equipmentUtils.ts` (614 lines ⚠️)  
**Validation:** `src/lib/equipmentValidation.ts` (416 lines ⚠️)  
**History:** `src/lib/equipmentHistoryService.ts` (242 lines)  
**Transfers:** `src/lib/transferRequestService.ts` (437 lines ⚠️)

---

## User Stories

### Viewing Equipment
- As a user, I can see a list of all equipment items in card view with status badges and condition indicators.  
  **Status:** ✅ Implemented
- As a user, I can see a daily check-in status badge on each item.  
  **Status:** ✅ Implemented
- As a user with permissions, I can filter equipment by status, category, and holder.  
  **Status:** ✅ Implemented (in `EquipmentList.tsx`)
- As a user, I can see equipment details in a modal (history, holder, condition, metadata).  
  **Status:** ✅ Implemented (`EquipmentModal.tsx`)

### Adding Equipment
- As a user with management access, I can add a new equipment item by selecting a template and filling in serial number, holder, condition, and notes.  
  **Status:** ✅ Implemented (`AddEquipmentModal.tsx`)
- As a user, I can create equipment from an existing template (type) with pre-filled fields from the template.  
  **Status:** ✅ Implemented
- As a user, I can create a new equipment type (template) if one doesn't exist.  
  **Status:** ✅ Implemented (`EquipmentTemplateForm.tsx`)

### Equipment Transfer
- As a user, I can request to transfer an equipment item to another holder.  
  **Status:** ✅ Implemented (`TransferModal.tsx`, `transferRequestService.ts`)
- As a user receiving a transfer, I can approve or reject the request.  
  **Status:** ✅ Implemented (approval via `useEquipment.ts`)
- As a user, I can see pending transfer requests.  
  **Status:** ✅ Implemented

### Daily Check-in
- As a holder, I can perform a daily check-in to confirm I have the equipment.  
  **Status:** ✅ Implemented (`performDailyCheckIn` in `equipmentUtils.ts`)
- As a user, I can see which equipment items are overdue for daily check-in.  
  **Status:** ✅ Implemented (`DailyStatusBadge.tsx`)

### Equipment Status & Condition
- As a user with permissions, I can update the operational status of an item (active, in maintenance, retired, lost).  
  **Status:** ✅ Implemented
- As a user, I can update the condition of an item (excellent, good, fair, poor, damaged).  
  **Status:** ✅ Implemented

### History
- As a user, I can view the full tracking history of an equipment item (transfers, status changes, check-ins).  
  **Status:** ✅ Implemented — last 20 entries stored in `trackingHistory` field; managed by `equipmentHistoryService.ts`

---

## In-Progress / TODO

- **Retirement request workflow:** `RetirementRequest` type is defined in `src/types/equipment.ts` but no retirement UI or service implementation exists yet. (`dailyStatusReporting.ts` also has only interface definitions — no implementation.)
- **Bulk operations:** `EquipmentList.tsx` has filter UI for multi-select but bulk-action on multiple items is not fully implemented.
- **Barcode/QR scanning:** Not started (planned in roadmap).
- **Commander emergency transfer override:** Designed in types/permissions but no UI implemented.
- **`equipmentInitializer.ts`:** Marked deprecated — templates are now managed via UI, not this initializer.

---

## Screens / Routes Involved

| Screen | File |
|--------|------|
| Main page | `src/app/equipment/page.tsx` |
| Equipment list | `src/components/equipment/EquipmentList.tsx` |
| Add equipment modal | `src/components/equipment/AddEquipmentModal.tsx` |
| Equipment detail modal | `src/components/equipment/EquipmentModal.tsx` |
| Template form | `src/components/equipment/EquipmentTemplateForm.tsx` |
| Transfer modal | `src/components/equipment/TransferModal.tsx` |
| Equipment card | `src/components/equipment/EquipmentCard.tsx` |
| Status badge | `src/components/equipment/EquipmentStatus.tsx` |
| Condition display | `src/components/equipment/EquipmentCondition.tsx` |
| Daily check badge | `src/components/equipment/DailyStatusBadge.tsx` |
| Error boundary | `src/components/equipment/EquipmentErrorBoundary.tsx` |
| Loading state | `src/components/equipment/EquipmentLoadingState.tsx` |
| Empty state | `src/components/equipment/EquipmentEmptyState.tsx` |
