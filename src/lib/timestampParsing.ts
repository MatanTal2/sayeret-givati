/**
 * Cross-shape timestamp parsing utility.
 *
 * Firestore timestamps arrive in many shapes depending on the read path:
 * - Client SDK `Timestamp` instance — has `toDate()`.
 * - Plain `Date` — when explicitly constructed.
 * - ISO string — common after JSON serialization.
 * - Numeric ms — Date.now() output etc.
 * - Plain object `{ seconds, nanoseconds }` — what Admin SDK timestamps
 *   serialize to when round-tripped through JSON / API routes.
 *
 * Returns 0 for missing / unparseable input. Callers must check `=== 0` to
 * decide whether to render a placeholder (e.g. "תאריך לא ידוע").
 */

interface TimestampClassLike {
  toDate: () => Date;
}

interface PlainTimestampShape {
  seconds?: number;
  nanoseconds?: number;
}

export type TimestampInput =
  | TimestampClassLike
  | Date
  | string
  | number
  | PlainTimestampShape
  | null
  | undefined;

function isTimestampClassLike(value: unknown): value is TimestampClassLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  );
}

function isPlainTimestamp(value: unknown): value is PlainTimestampShape {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { seconds?: unknown }).seconds === 'number'
  );
}

export function toMs(t: TimestampInput): number {
  if (t == null) return 0;
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'number') return Number.isFinite(t) ? t : 0;
  if (typeof t === 'string') {
    const ms = new Date(t).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (isTimestampClassLike(t)) {
    const ms = t.toDate().getTime();
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (isPlainTimestamp(t)) {
    const seconds = t.seconds ?? 0;
    const nanoseconds = t.nanoseconds ?? 0;
    return seconds * 1000 + Math.floor(nanoseconds / 1e6);
  }
  return 0;
}
