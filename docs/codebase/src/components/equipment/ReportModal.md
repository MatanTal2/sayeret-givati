# ReportModal

**File:** `src/components/equipment/ReportModal.tsx`

Camera capture + condition + note + submit flow for reporting on a single item.

## Photo bypass

A "report without photo" checkbox renders only when `canReportWithoutPhoto(user)` returns true (TL+). For regular users a photo is required and the submit button stays disabled until they capture one.

## Condition field

A Headless-UI `Select` (`src/components/ui/Select.tsx`) exposes the three `EquipmentCondition` values (GOOD / NEEDS_REPAIR / WORN). Default is `GOOD`. Labels live under `TEXT_CONSTANTS.FEATURES.EQUIPMENT.REPORT_MODAL.CONDITION_OPTIONS` (and `TEXT_EN.EQUIPMENT.REPORT_MODAL.CONDITION_OPTIONS` for the English mirror). The selection is required and is threaded through `onSubmit(photoUrl, note, condition)`.

## Upload path

Photo blob is uploaded to Firebase Storage via `uploadEquipmentPhoto(blob, equipment.id, 'report')` immediately before the report write. The download URL is then passed to the parent's `onSubmit` callback along with the chosen condition. The parent calls `EquipmentService.Items.reportEquipment` (via the `useEquipment` hook), which writes `lastReportUpdate`, `lastReportPhotoUrl`, `currentCondition`, a tracking-history entry (with `actor`, `condition`, `photoUrl`), and a `REPORT_SUBMITTED` action log (with `details.condition`) atomically.

## Camera viewfinder

`CameraCapture` renders a square viewfinder (`aspect-square`) so the live preview fits comfortably in the modal on small phones. The captured preview mirrors the same square crop.
