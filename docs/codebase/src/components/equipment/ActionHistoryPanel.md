# ActionHistoryPanel

**File:** `src/components/equipment/ActionHistoryPanel.tsx`

Modal timeline for one item. Merges two sources:

1. `equipment.trackingHistory` — denormalized array on the doc (cheap, always loaded with the item).
2. `actionsLog` collection — fetched per open via `getEquipmentActionLogs(equipmentId)`.

Both feed into a single sorted list so the user sees one chronology. Photos rendered when present (sign-up + report photos travel via `EquipmentHistoryEntry.photoUrl`).

Closes on overlay click. No mutation paths.

## Hebrew action labels

Action keys are mapped through `TEXT_CONSTANTS.FEATURES.EQUIPMENT.ACTION_TYPES` (35 entries covering every `ActionType` enum value). Unknown keys fall back to the raw enum string so the row never blanks out.

## Timestamp parsing

Timestamps in tracking entries can arrive as `Timestamp` instances, `Date`, ISO strings, numeric milliseconds, or — after admin-SDK round-trip — the Firestore plain-object shape `{ seconds, nanoseconds }`. The panel parses all of these via `src/lib/timestampParsing.ts:toMs`. If a timestamp is missing or unparseable the row renders the `UNKNOWN_DATE` placeholder (HE: "תאריך לא ידוע" / EN: "Unknown date") instead of leaking "Invalid Date" into the UI.

## Actor name on tracking entries

`EquipmentHistoryEntry.actor` denormalizes the actor display name onto each tracking write. Storage actions (`stored` / `reissued`) and `equipment_created` now populate this field. Older entries without `actor` render no actor row; new writes always include it. ActionsLog rows continue to surface `actorName` directly.

## Inline expand

Each row is a `role="button"` element (`tabIndex=0`, `aria-expanded`). Click — or Enter / Space — toggles a single-open expansion panel showing the source (`tracking` / `log`), the owner doc id, the `isPredecessor` flag, the full photo (`max-h-64`), the untruncated note, and `details.condition` when present. The full ISO timestamp was previously rendered here as well; it was dropped because the collapsed row already shows a localized `dd/mm/yy hh:mm` value, and double-rendering the same datum (in two formats, one of them debug-shaped) added noise without information. Escape collapses the open row. Transition is a simple `max-h` + `opacity` Tailwind animation.

## Predecessor pill

When the item has a predecessor chain (older items it was exchanged from), the header renders a pill formatted via `EXCHANGE.PREDECESSOR_PILL` substituting `{serial}` with the *display name* of the first predecessor, not its raw doc id. For items where `hasSerialNumber === false`, the doc id is a UUID that must never be shown — the pill falls back to the predecessor's `productName`. Computed once when the chain is walked and stored in component state.
