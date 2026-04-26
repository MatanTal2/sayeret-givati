# ReturnModal

**File:** `src/components/equipment/ReturnModal.tsx`

Retirement (return-to-army) confirmation modal. Only the signer ever sees this open — gating happens up the chain in `EquipmentRowActions` via `canRetire`.

## Two paths, one server call

The component shows different copy and a different submit label based on `isHolder`:

- `isHolder === true` → "this will retire the item immediately" (server takes the immediate path).
- `isHolder === false` → "this will notify {currentHolder}" (server creates a `RetirementRequest` for the holder to approve).

The component does **not** decide which path runs — the server (`serverRetireEquipment`) inspects holder vs. signer and returns `{ kind: 'immediate' | 'request' }` to tell the client which actually happened.
