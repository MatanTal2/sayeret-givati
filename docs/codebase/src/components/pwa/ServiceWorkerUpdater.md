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
4. "Update now" → posts `{ type: 'SKIP_WAITING' }` to the waiting worker.
5. `controllerchange` fires after the worker activates → page reloads.
6. "Later" hides the banner locally; next page load picks up the waiting worker again.

## Where it mounts

`src/app/layout.tsx`, inside `ToastProvider`. Renders nothing until a waiting worker is detected.

## Tests

Manual flow documented in `docs/codebase/pwa-shell.md`. Automated Playwright coverage lands in Phase 5/8.
