/**
 * Route allowlist for offline outbox eligibility. Deny-by-default (audit
 * decision in spec — auth/permission/audit/security-sensitive routes must
 * never queue silently).
 *
 * Each entry maps a `${method} ${pathPattern}` to:
 *  - `routeName` for telemetry / indexing.
 *  - `resourceKey(path)` for chained-If-Match rewriting (M3). Returns a
 *    deterministic string keyed by the resource that gets mutated; chained
 *    edits on the same resource share the key so replay rewrites the next
 *    entry's `If-Match` after each commit.
 *
 * Adding routes:
 * - Only add routes where replay-while-offline is desirable and the server
 *   handler is idempotent (i.e. wrapped with `withIdempotency`).
 * - Never add `/api/auth/*`, `/api/users/sessions/*`, `/api/users/phone-change/*`,
 *   `/api/cron/*`, `/api/permission-grants*`, `/api/force-ops`.
 *
 * See docs/spec/offline-first.md.
 */

export interface AllowlistMatch {
  routeName: string;
  resourceKey?: string;
}

interface AllowlistRule {
  method: string;
  pattern: RegExp;
  build: (match: RegExpMatchArray) => AllowlistMatch;
}

const RULES: AllowlistRule[] = [
  {
    method: 'POST',
    pattern: /^\/api\/equipment\/transfer$/,
    build: () => ({ routeName: 'equipment.transfer' }),
  },
  {
    method: 'POST',
    pattern: /^\/api\/equipment\/retire$/,
    build: () => ({ routeName: 'equipment.retire' }),
  },
  {
    method: 'POST',
    pattern: /^\/api\/equipment\/([^/]+)\/storage\/send$/,
    build: (m) => ({ routeName: 'equipment.storage.send', resourceKey: `equipment:${m[1]}` }),
  },
  {
    method: 'POST',
    pattern: /^\/api\/equipment\/([^/]+)\/storage\/pull$/,
    build: (m) => ({ routeName: 'equipment.storage.pull', resourceKey: `equipment:${m[1]}` }),
  },
  {
    method: 'PUT',
    pattern: /^\/api\/soldier-status\/([^/]+)$/,
    build: (m) => ({ routeName: 'soldier-status.update', resourceKey: `soldierStatus:${m[1]}` }),
  },
];

export function matchAllowlist(method: string, path: string): AllowlistMatch | null {
  const upper = method.toUpperCase();
  for (const rule of RULES) {
    if (rule.method !== upper) continue;
    const m = path.match(rule.pattern);
    if (m) return rule.build(m);
  }
  return null;
}
