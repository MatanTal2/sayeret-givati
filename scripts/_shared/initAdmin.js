/**
 * Shared bootstrap for plain-Node operator scripts (`node scripts/foo.js`).
 *
 * Every script under `scripts/` used to duplicate ~70 lines of identical
 * boilerplate: `.env.local` loading, service-account parsing
 * (plain-JSON or base64), project-id resolution from CLI / env, and
 * `admin.initializeApp`. Centralised here so a single fix lands in every
 * script.
 *
 * Conventions preserved verbatim from the originals:
 *  - Reads `GOOGLE_SERVICE_ACCOUNT_JSON` (NOT `GOOGLE_APPLICATION_CREDENTIALS`).
 *    The cred can be either plain JSON or base64-encoded JSON — same value
 *    the Next.js runtime uses at `src/lib/db/admin.ts`.
 *  - Reads `NEXT_PUBLIC_FIREBASE_PROJECT_ID` from `.env.local`, unless the
 *    caller passes `--project <id>` on the CLI.
 *  - `loadEnvLocal()` is intentionally a no-op when `.env.local` is missing
 *    so the script can still be driven by an already-exported env.
 *  - Existing env values are NEVER overwritten by `.env.local`.
 *
 * Usage:
 *   const { initAdmin, parseSharedArgs } = require('./_shared/initAdmin');
 *   const args = parseSharedArgs(process.argv.slice(2));
 *   const { admin, db } = initAdmin({ projectId: args.projectId });
 */

const admin = require('firebase-admin');
const { readFileSync } = require('fs');
const path = require('path');

const PROD_PROJECT_ID = 'sayeret-givati-1983';

/**
 * Parse `.env.local` into `process.env`. Quoted values are unwrapped.
 * Existing keys win — never clobber an already-exported env var.
 */
function loadEnvLocal() {
  try {
    const file = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of file.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local missing — fall through, caller may have exported env directly.
  }
}

/**
 * Accept the service-account value as either plain JSON or base64-encoded
 * JSON. Throws with a clear message if neither parse succeeds.
 */
function parseServiceAccount(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    /* fall through to base64 */
  }
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    throw new Error(
      `GOOGLE_SERVICE_ACCOUNT_JSON is neither plain JSON nor base64-encoded JSON: ${e.message}`,
    );
  }
}

/**
 * Pull common CLI flags out of `argv` so each script doesn't reimplement
 * the same `args.indexOf('--project')` dance. Unrecognised flags are
 * preserved on the returned object via `flag(name)` and `valueOf(name)`
 * helpers so each script can read its own bespoke flags from the same
 * source of truth.
 */
function parseSharedArgs(argv) {
  const args = Array.isArray(argv) ? argv : [];
  const projectIdx = args.indexOf('--project');
  const cliProjectId = projectIdx >= 0 ? args[projectIdx + 1] : undefined;
  return {
    raw: args,
    projectId: cliProjectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    dryRun: args.includes('--dry-run'),
    /** Boolean flag — `true` iff `--flag` appears anywhere. */
    flag(name) {
      return args.includes(`--${name}`);
    },
    /**
     * Value flag — returns the token immediately after `--name`, or
     * `undefined` if the flag isn't present or is the last token.
     */
    valueOf(name) {
      const idx = args.indexOf(`--${name}`);
      if (idx < 0 || idx === args.length - 1) return undefined;
      return args[idx + 1];
    },
  };
}

/**
 * Initialise firebase-admin and return the usual handles.
 *
 * Loads `.env.local` automatically (no-op if already loaded), validates
 * `projectId` + `GOOGLE_SERVICE_ACCOUNT_JSON`, and — when
 * `requireProdProject` is set — refuses to proceed unless the resolved
 * project id matches `sayeret-givati-1983`. The prod-project gate is
 * opt-in because most scripts are safe to dry-run against a preview env
 * but `sweep-account-deletions` is not.
 *
 * Returns `{ admin, db, auth, projectId, dryRun }`. The script's `dryRun`
 * is forwarded so the caller can keep a single source of truth.
 */
function initAdmin({ projectId, requireProdProject = false, scriptName = 'script' } = {}) {
  loadEnvLocal();

  const resolvedProjectId = projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!resolvedProjectId) {
    console.error(
      `[${scriptName}] Missing project id (pass --project or set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local)`,
    );
    process.exit(1);
  }
  if (requireProdProject && resolvedProjectId !== PROD_PROJECT_ID) {
    console.error(
      `[${scriptName}] refused: project ${resolvedProjectId} is not the prod project (${PROD_PROJECT_ID}). Aborting.`,
    );
    process.exit(1);
  }

  const saRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saRaw) {
    console.error(`[${scriptName}] Missing GOOGLE_SERVICE_ACCOUNT_JSON in .env.local`);
    process.exit(1);
  }
  let saJson;
  try {
    saJson = parseServiceAccount(saRaw);
  } catch (e) {
    console.error(`[${scriptName}] ${e.message}`);
    process.exit(1);
  }

  // Avoid re-initialising if a script is required twice (or if a test
  // already inited the app). admin.apps is the canonical check.
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(saJson),
      projectId: resolvedProjectId,
    });
  }

  return {
    admin,
    db: admin.firestore(),
    auth: admin.auth(),
    projectId: resolvedProjectId,
  };
}

module.exports = {
  PROD_PROJECT_ID,
  initAdmin,
  parseSharedArgs,
  loadEnvLocal,
  parseServiceAccount,
};
