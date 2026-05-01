/**
 * Export formatters for guard schedules — WhatsApp-friendly text and CSV.
 * Pure helpers, no DOM access; the offline tool re-uses the algorithm but
 * has its own simpler text rendering inline.
 */
import { buildCsv } from '@/lib/csv/parseCsv';
import type { GuardSchedule } from '@/types/guardSchedule';

const HEBREW_DAY = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function pad(n: number) { return n.toString().padStart(2, '0'); }

function parseLocal(s: string): Date {
  const [d, t] = s.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return new Date(y, mo - 1, da, h, mi);
}

function fmtDayHeader(s: string): string {
  const d = parseLocal(s);
  return `יום ${HEBREW_DAY[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

function fmtTime(s: string): string {
  const d = parseLocal(s);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function dayKey(s: string): string {
  return s.slice(0, 10); // YYYY-MM-DD
}

/**
 * WhatsApp-ready text. Groups by day, then by post under each day. Uses bullet
 * points and emoji separators that survive WhatsApp's RTL handling.
 */
export function formatScheduleAsText(schedule: GuardSchedule): string {
  const personById = new Map(schedule.roster.map((p) => [p.id, p.displayName]));
  const shiftById = new Map(schedule.shifts.map((s) => [s.id, s]));
  const assignments = schedule.assignments
    .map((a) => ({ a, shift: shiftById.get(a.shiftId)! }))
    .filter((row) => row.shift)
    .sort((x, y) =>
      x.shift.start === y.shift.start
        ? x.shift.postName.localeCompare(y.shift.postName, 'he')
        : x.shift.start.localeCompare(y.shift.start),
    );

  const lines: string[] = [`🛡️ ${schedule.title}`, ''];
  let lastDay = '';
  for (const { a, shift } of assignments) {
    const day = dayKey(shift.start);
    if (day !== lastDay) {
      if (lastDay) lines.push('');
      lines.push(`📅 ${fmtDayHeader(shift.start)}`);
      lastDay = day;
    }
    const names = a.personIds.map((id) => personById.get(id) ?? id).join(' + ');
    const lock = a.locked ? ' 🔒' : '';
    lines.push(`🕐 ${fmtTime(shift.start)}–${fmtTime(shift.end)} · ${shift.postName} — ${names || '—'}${lock}`);
  }
  return lines.join('\n');
}

/**
 * CSV columns: day, start, end, post, people, locked. UTF-8 BOM included so
 * Excel opens Hebrew correctly.
 */
export function formatScheduleAsCsv(schedule: GuardSchedule): string {
  const personById = new Map(schedule.roster.map((p) => [p.id, p.displayName]));
  const shiftById = new Map(schedule.shifts.map((s) => [s.id, s]));
  const headers = ['יום', 'התחלה', 'סיום', 'עמדה', 'משתתפים', 'נעול'];
  const rows = schedule.assignments
    .map((a) => ({ a, shift: shiftById.get(a.shiftId)! }))
    .filter((row) => row.shift)
    .sort((x, y) =>
      x.shift.start === y.shift.start
        ? x.shift.postName.localeCompare(y.shift.postName, 'he')
        : x.shift.start.localeCompare(y.shift.start),
    )
    .map(({ a, shift }) => ({
      'יום': fmtDayHeader(shift.start),
      'התחלה': fmtTime(shift.start),
      'סיום': fmtTime(shift.end),
      'עמדה': shift.postName,
      'משתתפים': a.personIds.map((id) => personById.get(id) ?? id).join(' + '),
      'נעול': a.locked ? 'כן' : 'לא',
    }));
  return buildCsv(headers, rows);
}
