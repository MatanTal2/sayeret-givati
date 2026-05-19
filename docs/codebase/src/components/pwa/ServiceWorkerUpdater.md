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
4. "Update now":
   - If the worker is already `'activated'` (rare but possible if the user sat on the toast through an activation), reload immediately.
   - Otherwise attach a `statechange` listener to the waiting worker, post `{ type: 'SKIP_WAITING' }`, and arm a 3-second fallback timer.
5. Reload triggers from whichever fires first: the `'activated'` state transition, or the 3-second fallback (mobile browsers, esp. iOS Safari, do not always fire `statechange` on a worker that never claims the current document).
6. "Later" hides the banner locally; next page load picks up the waiting worker again.

### Mobile fallback timer

`statechange → 'activated'` is the canonical signal, but iOS Safari and some Chromium-on-iOS WebKit shells do not reliably dispatch it for a worker that activates without adopting the current document (which is exactly our case under `clientsClaim: false`). Symptom on those devices: tap "Update Now" → SW activates in the background → page never reloads → toast stays up. The 3-second `setTimeout` reload fallback handles this — by the time it fires, the new SW is either already activated (so the reload picks it up immediately) or activating (so the next navigation picks it up). Both timers race; whichever wins clears the other.

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

## Positioning

Container: `fixed bottom-6 inset-x-4 mx-auto max-w-md ...`. The earlier
`start-1/2 -translate-x-1/2 w-[calc(100%-2rem)]` combination clipped the
toast off the left edge on mobile in `dir="rtl"`: `start-1/2` resolves to
`right: 50%`, then `-translate-x-1/2` is direction-neutral (`translateX(-50%)`),
so the element's center landed *left* of viewport center and a nearly-full
viewport width spilled off the left edge — hiding the "Update now" button.
The `inset-x-4 mx-auto max-w-md` pattern anchors both sides with a 16px
gutter and centers between them, so the layout is symmetric in RTL and LTR
and bounded on mobile.
