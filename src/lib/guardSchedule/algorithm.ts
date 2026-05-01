/**
 * Guard schedule generation algorithm.
 *
 * Pure, framework-free, dependency-free. The same module is bundled into
 * `public/tools/guard-scheduler.html` via `scripts/build-offline-guard-tool.mjs`,
 * so do not import anything outside this file.
 */
import type {
  GenerationInput,
  GenerationResult,
  GuardPost,
  HeadcountWindow,
  ISODateTime,
  PersonStat,
  RosterPerson,
  ScheduleConfig,
  ScheduleWarning,
  Shift,
  ShiftAssignment,
} from '@/types/guardSchedule';

// --- Time helpers (local datetime, no TZ shift) ----------------------------

export function parseLocal(s: ISODateTime): number {
  const [d, t] = s.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return new Date(y, mo - 1, da, h, mi).getTime();
}

export function formatLocal(ms: number): ISODateTime {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// --- Seeded PRNG (mulberry32) ----------------------------------------------

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function fisherYates<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Headcount lookup -------------------------------------------------------

function hourMatchesWindow(hour: number, w: HeadcountWindow): boolean {
  if (w.startHour === w.endHour) return false;
  if (w.startHour < w.endHour) return hour >= w.startHour && hour < w.endHour;
  // Wrap (e.g. 22 → 02): [start, 24) ∪ [0, end)
  return hour >= w.startHour || hour < w.endHour;
}

function shiftHourSet(startMs: number, endMs: number): number[] {
  const set = new Set<number>();
  let cursor = startMs;
  while (cursor < endMs) {
    set.add(new Date(cursor).getHours());
    cursor += 30 * 60 * 1000; // half-hour granularity
  }
  return Array.from(set);
}

function headcountForShift(post: GuardPost, startMs: number, endMs: number): number {
  if (!post.headcountWindows || post.headcountWindows.length === 0) {
    return post.defaultHeadcount;
  }
  const hours = shiftHourSet(startMs, endMs);
  let max = -1;
  let matched = false;
  for (const h of hours) {
    let bestForHour = -1;
    for (const w of post.headcountWindows) {
      if (hourMatchesWindow(h, w) && w.headcount > bestForHour) {
        bestForHour = w.headcount;
      }
    }
    if (bestForHour < 0) {
      // No window covers this hour — fall back to default for the hour
      if (post.defaultHeadcount > max) max = post.defaultHeadcount;
      matched = true;
    } else {
      if (bestForHour > max) max = bestForHour;
      matched = true;
    }
  }
  return matched ? Math.max(0, max) : post.defaultHeadcount;
}

// --- Shift expansion --------------------------------------------------------

export function expandShifts(posts: GuardPost[], config: ScheduleConfig): Shift[] {
  const startMs = parseLocal(config.startAt);
  const endMs = parseLocal(config.endAt);
  if (!(endMs > startMs)) return [];
  const stepMs = config.shiftDurationHours * 3600 * 1000;
  if (stepMs <= 0) return [];

  const shifts: Shift[] = [];
  for (const post of posts) {
    let cursor = startMs;
    let idx = 0;
    while (cursor < endMs) {
      const shiftEnd = Math.min(cursor + stepMs, endMs);
      shifts.push({
        id: `${post.id}_${idx}`,
        postId: post.id,
        postName: post.name,
        start: formatLocal(cursor),
        end: formatLocal(shiftEnd),
        requiredHeadcount: headcountForShift(post, cursor, shiftEnd),
      });
      cursor = shiftEnd;
      idx += 1;
    }
  }
  return shifts;
}

// --- Constraint helpers -----------------------------------------------------

function isoOverlap(aStart: ISODateTime, aEnd: ISODateTime, bStart: ISODateTime, bEnd: ISODateTime): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function violatesBlackout(person: RosterPerson, shift: Shift): boolean {
  if (!person.blackoutHours?.length) return false;
  for (const b of person.blackoutHours) {
    if (isoOverlap(b.start, b.end, shift.start, shift.end)) return true;
  }
  return false;
}

// --- Main generator ---------------------------------------------------------

export function generateSchedule(input: GenerationInput): GenerationResult {
  const shifts = expandShifts(input.posts, input.config);
  const seedSource = input.config.seed ?? `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  const rng = mulberry32(hashSeed(seedSource));

  // Deterministic random tiebreak order; recomputed once per generation.
  const shuffled = fisherYates(input.roster, rng);
  const orderIndex = new Map<string, number>(shuffled.map((p, i) => [p.id, i]));

  const shiftsAssignedCount = new Map<string, number>();
  const lastShiftEnd = new Map<string, ISODateTime>();
  for (const p of input.roster) {
    shiftsAssignedCount.set(p.id, 0);
    lastShiftEnd.set(p.id, '');
  }

  const existing = new Map<string, ShiftAssignment>();
  for (const a of input.existingAssignments ?? []) existing.set(a.shiftId, a);

  const sortedShifts = shifts.slice().sort((a, b) =>
    a.start === b.start ? a.id.localeCompare(b.id) : a.start.localeCompare(b.start),
  );

  const assignments: ShiftAssignment[] = [];
  const warnings: ScheduleWarning[] = [];
  let rrPointer = 0;

  for (const shift of sortedShifts) {
    const ex = existing.get(shift.id);
    if (ex && ex.locked) {
      assignments.push(ex);
      for (const pid of ex.personIds) {
        shiftsAssignedCount.set(pid, (shiftsAssignedCount.get(pid) ?? 0) + 1);
        const prev = lastShiftEnd.get(pid) ?? '';
        if (shift.end > prev) lastShiftEnd.set(pid, shift.end);
      }
      continue;
    }

    const need = shift.requiredHeadcount;
    if (need <= 0 || input.roster.length === 0) {
      assignments.push({ shiftId: shift.id, personIds: [], locked: false });
      continue;
    }

    let candidates: RosterPerson[] = input.roster.slice();

    if (input.config.algorithm === 'constraint_aware') {
      const filtered = candidates.filter((p) => !violatesBlackout(p, shift));
      if (filtered.length < need) {
        warnings.push({
          code: 'blackout_overrun',
          message: `Insufficient non-blacked-out personnel for shift ${shift.id}; falling back to full roster.`,
          shiftId: shift.id,
        });
      } else {
        candidates = filtered;
      }
    }

    if (candidates.length < need) {
      warnings.push({
        code: 'cannot_meet_headcount',
        message: `Shift ${shift.id} needs ${need} but only ${candidates.length} available.`,
        shiftId: shift.id,
      });
    }

    let picked: RosterPerson[];

    if (input.config.algorithm === 'round_robin') {
      const take = Math.min(need, candidates.length);
      picked = [];
      const start = candidates.length === 0 ? 0 : rrPointer % candidates.length;
      for (let i = 0; i < take; i++) {
        picked.push(candidates[(start + i) % candidates.length]);
      }
      rrPointer += take;
    } else {
      // random_fair (and constraint_aware after blackout filter)
      const ranked = candidates.slice().sort((a, b) => {
        const aShifts = shiftsAssignedCount.get(a.id) ?? 0;
        const bShifts = shiftsAssignedCount.get(b.id) ?? 0;
        if (aShifts !== bShifts) return aShifts - bShifts;
        const aLast = lastShiftEnd.get(a.id) ?? '';
        const bLast = lastShiftEnd.get(b.id) ?? '';
        if (aLast !== bLast) return aLast.localeCompare(bLast); // earlier last = more rested
        return (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0);
      });
      picked = ranked.slice(0, Math.min(need, ranked.length));
    }

    const personIds = picked.map((p) => p.id);
    assignments.push({ shiftId: shift.id, personIds, locked: false });
    for (const pid of personIds) {
      shiftsAssignedCount.set(pid, (shiftsAssignedCount.get(pid) ?? 0) + 1);
      const prev = lastShiftEnd.get(pid) ?? '';
      if (shift.end > prev) lastShiftEnd.set(pid, shift.end);
    }
  }

  const stats: PersonStat[] = input.roster.map((p) => ({
    personId: p.id,
    shiftsAssigned: shiftsAssignedCount.get(p.id) ?? 0,
    totalHours: (shiftsAssignedCount.get(p.id) ?? 0) * input.config.shiftDurationHours,
  }));

  const counts = stats.map((s) => s.shiftsAssigned);
  const fairnessScore = counts.length === 0 ? 0 : Math.max(...counts) - Math.min(...counts);

  const maxRequired = shifts.reduce((m, s) => Math.max(m, s.requiredHeadcount), 0);
  if (input.roster.length > 0 && input.roster.length < maxRequired) {
    warnings.push({
      code: 'roster_too_small',
      message: `Roster size ${input.roster.length} is smaller than the maximum required headcount ${maxRequired}.`,
    });
  }

  return { shifts, assignments, stats, fairnessScore, warnings };
}
