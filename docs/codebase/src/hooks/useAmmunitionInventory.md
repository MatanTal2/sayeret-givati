# useAmmunitionInventory

**File:** `src/hooks/useAmmunitionInventory.ts`
**Status:** Active (Phase 3 — Ammunition feature)

## Purpose

Client hook combining BRUCE/LOOSE_COUNT stock with SERIAL items, plus mutators
that route through `/api/ammunition-inventory`. Used by both the `/ammunition`
user page and the management `AmmunitionInventorySection`.

## Return shape

```ts
{
  stock: AmmunitionStock[];
  items: AmmunitionItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  upsertStock(payload): Promise<boolean>;
  deleteStock(id): Promise<boolean>;
  createSerialItem(payload): Promise<boolean>;
  updateSerialItem(serial, payload): Promise<boolean>;
  deleteSerialItem(serial): Promise<boolean>;
}
```

## API surface

| Hook method | Network call |
|-------------|--------------|
| `refresh` | client-SDK reads via `listAmmunitionStock` + `listSerialAmmunitionItems` |
| `upsertStock(payload)` | `POST /api/ammunition-inventory` with `kind=stock` |
| `deleteStock(id)` | `DELETE /api/ammunition-inventory/[id]` with `kind=stock` |
| `createSerialItem(payload)` | `POST /api/ammunition-inventory` with `kind=item` |
| `updateSerialItem(serial, payload)` | `PUT /api/ammunition-inventory/[id]` with `kind=item` |
| `deleteSerialItem(serial)` | `DELETE /api/ammunition-inventory/[id]` with `kind=item` |
