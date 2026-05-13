# page.tsx (Convoy tool)

**File:** `src/app/tools/convoy/page.tsx`
**Status:** Active

## Purpose

Embeds the standalone `hmmwvConvoy.html` tool inside the unified app shell at `/tools/convoy`.

## Layout

Wrapped in `AuthGuard` + `AppShell` with `hidePageHeader` and `mainClassName="flex-1 flex flex-col min-h-0"` so the iframe fills remaining viewport height under the unified `TopBar`.

Sub-bar below `TopBar`:
- "← חזרה לכלים" link → `/tools`
- "⬇️ הורד" button → triggers download of `/tools/hmmwvConvoy.html` as `מארגן-שיירות.html`

Iframe loads `/tools/hmmwvConvoy.html` with `flex-1` to consume the remaining vertical space.

## Notes

Recent-route tracking is handled by `AppShell` via the `title` prop — no per-page `trackRouteVisit` call.

## Standalone HTML behavior (`public/tools/hmmwvConvoy.html`)

### In-app dialogs (no browser `alert`/`confirm`)

The HTML defines three dialog helpers — used everywhere instead of native browser dialogs:
- `showToast(message, type)` — transient, non-blocking. For success/info confirmations.
- `showInfoModal(message, title?)` — blocking single-button info/error. One "סגור" button.
- `showConfirmModal(message, title, confirmLabel, onConfirm)` — blocking two-button confirm. The `onConfirm` callback fires only on the affirmative button.
- `showActionModal(message, title, buttons[])` — generic N-button modal (used by `spreadPersonnel` for its 3-way "reset / append / cancel" choice).

All four reuse the same `#infoModal` markup, so adding a new dialog type does not require new HTML.

### Mobile viewport

Viewport meta is set to `maximum-scale=1.0, user-scalable=no` to prevent iOS auto-zoom on input focus and to keep the page locked at mobile width. Combined with a `@media (max-width: 768px)` rule that bumps every input/select/textarea to `font-size: 16px !important` (the threshold below which iOS auto-zooms), inputs no longer trigger zoom-in on tap.

### Personnel-spread modal scroll preservation

`toggleManualName` patches the DOM in place (counter span text, per-row classes, footer button) instead of calling `innerHTML = ...` on the scrollable body. This preserves `scrollTop` on the inner passenger list — without this fix, every checkbox tap reset scroll to the top, making the list unusable on mobile.

### Offline mode caveats (`file://`)

The file is fully self-contained — all HTML/CSS/JS is inline, no external `<link>`/`<script>`, no `fetch`/XHR, no service worker — so it renders correctly when downloaded and opened directly. The known issue is `localStorage` under `file://`:

- **Firefox:** works.
- **Chrome / Edge (default):** silently blocked unless launched with `--allow-file-access-from-files`.
- **iOS Safari from the Files app:** writes appear to succeed but are not persisted across launches.

Symptoms: templates won't save, deletes appear to revert on reload. The page logs a `console.warn` when `location.protocol === 'file:'`; `saveTemplatesData` and `deleteConvoyTemplate` show an offline-aware modal explaining the situation. Future improvement (separate PR): add Export/Import JSON buttons to bypass localStorage entirely.

### Template shape (v1 → v2)

`saveConvoyTemplate` writes `{ vehicles: Vehicle[], includesPersonnel: boolean }` under `localStorage["convoyMasterTemplates"][name]`. The pre-existing flat-array shape (`Vehicle[]`) is still accepted on load and treated as `{ vehicles: data, includesPersonnel: true }` via the `unwrapTemplate` helper — older templates remain usable, no migration needed.

When the current convoy has at least one passenger anywhere, `saveConvoyTemplate` opens a 3-button `showActionModal`: `שמור תפקידים בלבד` (strips `v.passengers = []` per vehicle), `שמור כולל חברים` (keeps them verbatim), `חזרה` (abort). When there are no passengers anywhere, the modal is skipped and the save runs directly with `includesPersonnel: false`. If a template already exists under the chosen name, the overwrite-confirm runs first and the personnel choice fires only after the user confirms overwrite. The save toast and the load toast both annotate which mode was used.

### Open follow-ups

- **Bug 4 (separate PR):** offline-mode banner + Export/Import templates as JSON.
- **Sister tool `logistics.html`** still uses native `alert`/`confirm`/`prompt` — same migration to the in-app modal helpers should be applied. Tracked as a separate sweep.

