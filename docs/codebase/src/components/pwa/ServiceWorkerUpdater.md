# ServiceWorkerUpdater.tsx

**File:** `src/components/pwa/ServiceWorkerUpdater.tsx`
**Status:** Active (Phase 3)

## Purpose

Registers `/sw.js` on the client and surfaces a bilingual update banner
(`PWA.UPDATE_AVAILABLE_*` in `src/constants/text*.ts`) when a new SW is
installed and waiting. User-driven activation only — audit note M5.

## Lifecycle

1. Mounts → `navigator.serviceWorker.register('/sw.js')`.
2. Reads existing `reg.waiting`; subscribes to `updatefound` for future installs.
3. When a waiting worker is present, renders an action banner.
4. "Update now" → attaches a `statechange` listener to the waiting worker, then posts `{ type: 'SKIP_WAITING' }`.
5. The listener fires when the worker reaches `'activated'` → page reloads.
6. "Later" hides the banner locally; next page load picks up the waiting worker again.

### Why `statechange` and not `controllerchange`

`src/app/sw.ts` sets `clientsClaim: false` so the activated SW does NOT take
over the currently-loaded document — `navigator.serviceWorker.controller`
stays pointing at the old worker, so `controllerchange` never fires for this
page. The previous implementation relied on `controllerchange` and the toast
appeared to "never disappear after reload": the user clicked Update Now, no
reload happened (because the event never fired), and a manual F5 re-read
`reg.waiting` and re-rendered the toast. Listening to the waiting worker's
own `statechange` is the canonical signal across browsers regardless of the
claim policy. Regression test:
`src/components/pwa/__tests__/ServiceWorkerUpdater.test.tsx`.

## Where it mounts

`src/app/layout.tsx`, inside `ToastProvider`. Renders nothing until a waiting worker is detected.

## Tests

- `src/components/pwa/__tests__/ServiceWorkerUpdater.test.tsx` — covers the regression: after SKIP_WAITING, reload fires only when the waiting worker reaches `'activated'`, and no global `controllerchange` listener is registered.
- Manual end-to-end flow documented in `docs/codebase/pwa-shell.md`.
