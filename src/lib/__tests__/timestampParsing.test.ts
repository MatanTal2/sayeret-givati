/**
 * Unit tests for the cross-shape timestamp parser.
 *
 * Fixed bug: previously `toMs({seconds, nanoseconds})` produced NaN (via
 * `new Date({...}).getTime()`), which downstream rendered as "Invalid Date"
 * in `ActionHistoryPanel` for `equipment_created` entries written through
 * the admin SDK path.
 */
import { toMs } from '../timestampParsing';

describe('toMs', () => {
  it('returns 0 for undefined / null', () => {
    expect(toMs(undefined)).toBe(0);
    expect(toMs(null)).toBe(0);
  });

  it('handles Date instances', () => {
    const d = new Date('2026-01-02T03:04:05Z');
    expect(toMs(d)).toBe(d.getTime());
  });

  it('handles numeric milliseconds', () => {
    expect(toMs(1736825045000)).toBe(1736825045000);
  });

  it('returns 0 for non-finite numbers', () => {
    expect(toMs(Number.NaN)).toBe(0);
    expect(toMs(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('parses ISO strings', () => {
    const iso = '2026-01-02T03:04:05.000Z';
    expect(toMs(iso)).toBe(new Date(iso).getTime());
  });

  it('returns 0 for unparseable strings', () => {
    expect(toMs('not a date')).toBe(0);
  });

  it('handles client SDK Timestamp instances (objects with toDate)', () => {
    const d = new Date('2026-03-15T12:00:00Z');
    const ts = { toDate: () => d };
    expect(toMs(ts)).toBe(d.getTime());
  });

  it('handles Firestore admin plain-object timestamps {seconds, nanoseconds}', () => {
    // Equivalent to Date('2026-04-01T00:00:00Z')
    const epoch = Date.UTC(2026, 3, 1, 0, 0, 0);
    const seconds = Math.floor(epoch / 1000);
    const nanoseconds = 500_000_000; // +0.5s
    const ms = toMs({ seconds, nanoseconds });
    expect(ms).toBe(seconds * 1000 + 500);
  });

  it('handles plain-object timestamps missing nanoseconds', () => {
    const seconds = 1_736_825_045;
    expect(toMs({ seconds })).toBe(seconds * 1000);
  });

  it('returns 0 for plain objects without seconds', () => {
    expect(toMs({} as { seconds?: number })).toBe(0);
  });
});
