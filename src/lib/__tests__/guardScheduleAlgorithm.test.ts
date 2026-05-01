import {
  expandShifts,
  generateSchedule,
  hashSeed,
  mulberry32,
  parseLocal,
  formatLocal,
} from '@/lib/guardSchedule/algorithm';
import type {
  GenerationInput,
  GuardPost,
  RosterPerson,
  ScheduleConfig,
  ShiftAssignment,
} from '@/types/guardSchedule';

const post = (id: string, name: string, defaultHeadcount = 1, headcountWindows: GuardPost['headcountWindows'] = []): GuardPost => ({
  id,
  name,
  defaultHeadcount,
  headcountWindows,
});

const person = (id: string, displayName?: string): RosterPerson => ({
  id,
  source: 'firestore',
  displayName: displayName ?? id,
});

const config = (overrides: Partial<ScheduleConfig> = {}): ScheduleConfig => ({
  startAt: '2026-05-02T18:00',
  endAt: '2026-05-03T06:00',
  shiftDurationHours: 2,
  algorithm: 'random_fair',
  seed: 'test',
  ...overrides,
});

describe('time helpers', () => {
  it('parseLocal/formatLocal round-trip', () => {
    const ms = parseLocal('2026-05-02T18:30');
    expect(formatLocal(ms)).toBe('2026-05-02T18:30');
  });
});

describe('mulberry32 PRNG', () => {
  it('is deterministic given same seed', () => {
    const a = mulberry32(hashSeed('seed-x'));
    const b = mulberry32(hashSeed('seed-x'));
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(hashSeed('seed-x'));
    const b = mulberry32(hashSeed('seed-y'));
    expect(a()).not.toBe(b());
  });
});

describe('expandShifts', () => {
  it('slices range into shift buckets per post', () => {
    const shifts = expandShifts([post('p1', 'A'), post('p2', 'B')], config({ shiftDurationHours: 4 }));
    // 12 hour range / 4h = 3 shifts × 2 posts = 6
    expect(shifts).toHaveLength(6);
    expect(shifts[0].postId).toBe('p1');
    expect(shifts[0].start).toBe('2026-05-02T18:00');
    expect(shifts[0].end).toBe('2026-05-02T22:00');
  });

  it('uses defaultHeadcount when no windows defined', () => {
    const shifts = expandShifts([post('p1', 'A', 3)], config({ shiftDurationHours: 4 }));
    expect(shifts.every((s) => s.requiredHeadcount === 3)).toBe(true);
  });

  it('applies max headcount across overlapping windows', () => {
    // Window 18:00-22:00 needs 2; 22:00-02:00 needs 1
    const p = post('p1', 'A', 1, [
      { startHour: 18, endHour: 22, headcount: 2 },
      { startHour: 22, endHour: 2, headcount: 1 },
    ]);
    const shifts = expandShifts([p], config({ shiftDurationHours: 2 }));
    // 18:00-20:00 → 2; 20:00-22:00 → 2; 22:00-00:00 → 1; 00:00-02:00 → 1; 02:00-04:00 → default 1; 04:00-06:00 → default 1
    expect(shifts.map((s) => s.requiredHeadcount)).toEqual([2, 2, 1, 1, 1, 1]);
  });

  it('handles midnight-crossing window', () => {
    const p = post('p1', 'A', 1, [{ startHour: 22, endHour: 2, headcount: 3 }]);
    const shifts = expandShifts([p], config({ shiftDurationHours: 2 }));
    // 22-00 and 00-02 should be 3
    expect(shifts[2].requiredHeadcount).toBe(3);
    expect(shifts[3].requiredHeadcount).toBe(3);
  });

  it('returns empty when start >= end', () => {
    expect(expandShifts([post('p1', 'A')], config({ endAt: '2026-05-02T18:00' }))).toEqual([]);
  });
});

describe('generateSchedule — random_fair', () => {
  it('is deterministic given fixed seed', () => {
    const input: GenerationInput = {
      posts: [post('p1', 'Main', 1)],
      roster: ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => person(x)),
      config: config(),
    };
    const r1 = generateSchedule(input);
    const r2 = generateSchedule(input);
    expect(r2.assignments.map((a) => a.personIds)).toEqual(r1.assignments.map((a) => a.personIds));
  });

  it('achieves fairness ≤ 1 when shifts × headcount divides evenly into roster', () => {
    // 1 post, 6 shifts of 2h, 6 ppl, headcount 1 → fairness 0
    const input: GenerationInput = {
      posts: [post('p1', 'Main', 1)],
      roster: ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => person(x)),
      config: config(),
    };
    const r = generateSchedule(input);
    expect(r.fairnessScore).toBeLessThanOrEqual(1);
    const counts = r.stats.map((s) => s.shiftsAssigned).sort((a, b) => a - b);
    expect(counts[counts.length - 1] - counts[0]).toBeLessThanOrEqual(1);
  });

  it('expands required headcount per shift correctly', () => {
    const p = post('p1', 'Main', 1, [{ startHour: 18, endHour: 22, headcount: 2 }]);
    const input: GenerationInput = {
      posts: [p],
      roster: ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => person(x)),
      config: config(),
    };
    const r = generateSchedule(input);
    const firstShiftAssign = r.assignments.find((a) => a.shiftId === 'p1_0')!;
    expect(firstShiftAssign.personIds).toHaveLength(2);
  });

  it('preserves locked existing assignments on regenerate', () => {
    const input: GenerationInput = {
      posts: [post('p1', 'Main', 1)],
      roster: ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => person(x)),
      config: config(),
      existingAssignments: [{ shiftId: 'p1_0', personIds: ['z-locked'], locked: true }],
    };
    const r = generateSchedule(input);
    const first = r.assignments.find((a) => a.shiftId === 'p1_0')!;
    expect(first.personIds).toEqual(['z-locked']);
    expect(first.locked).toBe(true);
  });

  it('emits roster_too_small warning when roster < max headcount', () => {
    const p = post('p1', 'Main', 5);
    const input: GenerationInput = {
      posts: [p],
      roster: [person('a'), person('b')],
      config: config({ shiftDurationHours: 12 }),
    };
    const r = generateSchedule(input);
    expect(r.warnings.some((w) => w.code === 'roster_too_small')).toBe(true);
  });

  it('handles single-person roster (assigns same person to all shifts)', () => {
    const input: GenerationInput = {
      posts: [post('p1', 'Main', 1)],
      roster: [person('solo')],
      config: config(),
    };
    const r = generateSchedule(input);
    expect(r.assignments.every((a) => a.personIds.length === 1 && a.personIds[0] === 'solo')).toBe(true);
  });

  it('handles empty roster (no assignments + warnings)', () => {
    const input: GenerationInput = {
      posts: [post('p1', 'Main', 1)],
      roster: [],
      config: config(),
    };
    const r = generateSchedule(input);
    expect(r.assignments.every((a) => a.personIds.length === 0)).toBe(true);
    expect(r.fairnessScore).toBe(0);
  });
});

describe('generateSchedule — round_robin', () => {
  it('rotates pointer across shifts', () => {
    const input: GenerationInput = {
      posts: [post('p1', 'Main', 1)],
      roster: ['a', 'b', 'c'].map((x) => person(x)),
      config: config({ algorithm: 'round_robin', shiftDurationHours: 4, seed: 'rr' }),
    };
    const r = generateSchedule(input);
    // 12h / 4h = 3 shifts → a, b, c in order
    expect(r.assignments.map((a) => a.personIds[0])).toEqual(['a', 'b', 'c']);
  });

  it('does not duplicate same person within one shift when need exceeds 1 but roster allows', () => {
    const input: GenerationInput = {
      posts: [post('p1', 'Main', 2)],
      roster: ['a', 'b', 'c'].map((x) => person(x)),
      config: config({ algorithm: 'round_robin', shiftDurationHours: 4, seed: 'rr' }),
    };
    const r = generateSchedule(input);
    for (const a of r.assignments) {
      expect(new Set(a.personIds).size).toBe(a.personIds.length);
    }
  });
});

describe('generateSchedule — constraint_aware', () => {
  it('skips ppl whose blackout overlaps the shift', () => {
    const a: RosterPerson = {
      ...person('a'),
      blackoutHours: [{ start: '2026-05-02T18:00', end: '2026-05-02T20:00' }],
    };
    const input: GenerationInput = {
      posts: [post('p1', 'Main', 1)],
      roster: [a, person('b'), person('c')],
      config: config({ algorithm: 'constraint_aware' }),
    };
    const r = generateSchedule(input);
    const first = r.assignments.find((a2) => a2.shiftId === 'p1_0')!;
    expect(first.personIds).not.toContain('a');
  });

  it('emits blackout_overrun warning when filtering leaves too few candidates', () => {
    const blackEveryone: ShiftAssignment[] = [];
    void blackEveryone;
    const blackouts = [{ start: '2026-05-02T18:00', end: '2026-05-03T06:00' }];
    const input: GenerationInput = {
      posts: [post('p1', 'Main', 1)],
      roster: [
        { ...person('a'), blackoutHours: blackouts },
        { ...person('b'), blackoutHours: blackouts },
      ],
      config: config({ algorithm: 'constraint_aware' }),
    };
    const r = generateSchedule(input);
    expect(r.warnings.some((w) => w.code === 'blackout_overrun')).toBe(true);
  });
});
