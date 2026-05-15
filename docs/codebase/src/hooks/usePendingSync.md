# usePendingSync.ts

**File:** `src/hooks/usePendingSync.ts`
**Status:** Active (Phase 5b — audit S9 partial)
**Spec:** `docs/spec/offline-first.md` Phase 5b.

## Purpose

Selector over `OutboxContext.pendingResourceKeys`. Lets list components
flag rows as "syncing" without each maintaining local optimistic state.

## Signature

```ts
usePendingSync(keys?: readonly string[]): (key: string) => boolean
```

- Pass the resource keys you render (e.g. `equipment:EQ-1234`).
- Returns a lookup function. `true` means an uncommitted outbox entry
  exists for that key.

No-arg form: returns a function that accepts any key (less efficient — full
context Set lookup per call).

## Resource key convention

`<domain>:<id>`. Same shape `src/lib/offline/allowlist.ts` uses when it
builds `resourceKey` for queued entries. Examples:

- `equipment:${equipmentId}`
- `soldierStatus:${militaryPersonalNumberHash}`

If `allowlist.ts` doesn't set a `resourceKey` for a route, queued entries
for that route are not surfaced by this hook (intentional — those routes
don't have a single resource to mark).

## When to use

- Equipment list, status board, ammunition rosters — anything that
  renders rows of resources that can be mutated offline.

## When NOT to use

- Single-resource detail pages — they can read `entries` directly from
  `useOutbox()` and project the pending mutation onto the displayed state.
  Phase 5c (not shipped) will add a higher-level projection helper.

## Related

- `src/contexts/OutboxContext.tsx` — source of truth.
- `src/lib/offline/allowlist.ts` — where resource keys are minted.
