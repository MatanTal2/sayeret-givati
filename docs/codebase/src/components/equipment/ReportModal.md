# ReportModal

**File:** `src/components/equipment/ReportModal.tsx`

Camera capture + note + submit flow for reporting on a single item.

## Photo bypass

A "report without photo" checkbox renders only when `canReportWithoutPhoto(user)` returns true (TL+). For regular users a photo is required and the submit button stays disabled until they capture one.

## Upload path

Photo blob is uploaded to Firebase Storage via `uploadEquipmentPhoto(blob, equipment.id, 'report')` immediately before the report write. The download URL is then passed to the parent's `onSubmit` callback. The parent calls `EquipmentService.Items.reportEquipment` (via the `useEquipment` hook), which writes `lastReportUpdate`, `lastReportPhotoUrl`, a tracking-history entry, and a `DAILY_CHECK_IN` action log atomically.
