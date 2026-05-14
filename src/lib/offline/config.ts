/**
 * Offline-first config. See docs/spec/offline-first.md.
 *
 * Phase 0 only ships the constants. Outbox + replay code (Phase 5) consumes them.
 */

const DEFAULT_REPLAY_CONCURRENCY = 3;

function parseConcurrency(raw: string | undefined): number {
  if (!raw) return DEFAULT_REPLAY_CONCURRENCY;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_REPLAY_CONCURRENCY;
  return n;
}

/**
 * Max concurrent in-flight replay requests when draining the outbox.
 *
 * Conservatively small (3) so a reconnect with a deep queue does not stampede
 * Vercel function concurrency or Firestore transaction contention. See audit
 * note S3 in `docs/spec/offline-first.md`.
 *
 * Override via `NEXT_PUBLIC_OFFLINE_REPLAY_CONCURRENCY` (positive integer).
 */
export const OFFLINE_REPLAY_CONCURRENCY = parseConcurrency(
  process.env.NEXT_PUBLIC_OFFLINE_REPLAY_CONCURRENCY,
);
