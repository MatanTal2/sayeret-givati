# ActionHistoryPanel

**File:** `src/components/equipment/ActionHistoryPanel.tsx`

Modal timeline for one item. Merges two sources:

1. `equipment.trackingHistory` — denormalized array on the doc (cheap, always loaded with the item).
2. `actionsLog` collection — fetched per open via `getEquipmentActionLogs(equipmentId)`.

Both feed into a single sorted list so the user sees one chronology. Photos rendered when present (sign-up + report photos travel via `EquipmentHistoryEntry.photoUrl`).

Closes on overlay click. No mutation paths.
