# scripts/

Operator-callable Node scripts that talk to Firestore + Firebase Auth via the Admin SDK. Each runs as plain `node scripts/<name>.js` — no transpiler, no build step.

## Shared bootstrap

All scripts share `_shared/initAdmin.js`:

| Helper | Job |
|---|---|
| `loadEnvLocal()` | Parse `.env.local` into `process.env` without clobbering existing keys |
| `parseServiceAccount(raw)` | Accept either plain JSON or base64-encoded JSON in `GOOGLE_SERVICE_ACCOUNT_JSON` |
| `parseSharedArgs(argv)` | Pull `--project` / `--dry-run` out of `argv` and expose `flag(name)` + `valueOf(name)` for script-specific args |
| `initAdmin({ projectId, requireProdProject, scriptName })` | Validate env, init `firebase-admin`, return `{ admin, db, auth, projectId }` |

The `requireProdProject` flag is opt-in. Use it for scripts that touch production-only state (e.g. `sweep-account-deletions`); leave it off for scripts that should be safe to dry-run against a preview project.

## Environment

All scripts read from `.env.local`:

| Var | Notes |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Service-account credential. Plain JSON or base64. Same value the Next.js runtime uses at `src/lib/db/admin.ts`. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Default project id. Override per-invocation with `--project <id>`. |

You can also export these directly in your shell — `.env.local` never clobbers an already-exported var.

## Inventory

| Script | Purpose | Idempotent | Prod-only |
|---|---|---|---|
| `backfill-phone-book.js` | Seed `phoneBook/{hash}` from `users` ∪ `authorized_personnel` | yes | no |
| `backfill-equipment-has-serial.js` | Backfill `equipment.hasSerialNumber` from template flag | yes | no |
| `purge-credential-audit-log.js` | Delete `credentialAuditLog` rows past 365-day retention (Council Q5=a). Cron runs the same logic daily; this is the manual fallback. | yes | no |
| `purge-phone-change-pending.js` | Delete `phoneChangePending/{uid}` reservations older than `--age-hours` (default 24) | yes | no |
| `reconcile-phone.js` | Detect / fix drift between Firebase Auth and Firestore `users.phoneNumber`. Report-only without `--fix`. | yes | no |
| `sweep-account-deletions.js` | Hard-delete soft-deleted users past the 30-day retention window. Mirror of the daily cron. | yes (resumable via `users.deletionStartedAt`) | **yes** |
| `check-bundle-size.js` | Run after `next build`. Prints gzipped first-load JS of the largest entrypoint. Fails when over `bundle-budget.json.maxFirstLoadKB`. Wired via `npm run bundle-budget`. CI hookup lands with the Serwist SW PR (Phase 3 of `docs/spec/offline-first.md`). | yes | no |

## Common flags

| Flag | Effect |
|---|---|
| `--project <id>` | Override project id |
| `--dry-run` | Log planned writes; never persist |

Script-specific flags are documented in each file's header comment.

## Adding a new script

```js
const { initAdmin, parseSharedArgs } = require('./_shared/initAdmin');

const args = parseSharedArgs(process.argv.slice(2));
const { admin, db } = initAdmin({
  projectId: args.projectId,
  scriptName: 'my-script',
});

async function main() {
  // ... use db.collection(...) etc.
}

main().catch((e) => { console.error(e); process.exit(1); });
```

That's the whole template. Don't reinvent `loadEnvLocal` / `parseServiceAccount` — call into `_shared/initAdmin.js`.
