/**
 * Parity check: the offline `public/tools/guard-scheduler.html` ships its own
 * hand-written port of the algorithm. This test extracts the JS between
 * `// @begin-algorithm` and `// @end-algorithm` markers and asserts it
 * produces identical results to the TS module for representative inputs.
 *
 * If the offline port drifts from the TS source, this test fails — keeping
 * both copies aligned across edits.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import vm from 'vm';
import {
  expandShifts as tsExpandShifts,
  generateSchedule as tsGenerateSchedule,
} from '@/lib/guardSchedule/algorithm';
import type { GenerationInput } from '@/types/guardSchedule';

interface OfflineModule {
  expandShifts: (...args: unknown[]) => unknown;
  generateSchedule: (input: GenerationInput) => ReturnType<typeof tsGenerateSchedule>;
}

function loadOffline(): OfflineModule {
  const htmlPath = resolve(__dirname, '../../../public/tools/guard-scheduler.html');
  const html = readFileSync(htmlPath, 'utf-8');
  const match = html.match(/\/\/ @begin-algorithm([\s\S]*?)\/\/ @end-algorithm/);
  if (!match) throw new Error('algorithm markers not found in offline HTML tool');
  const code = match[1];
  const ctx: Record<string, unknown> = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const win = ctx.window as { __guardSchedule?: OfflineModule };
  if (!win.__guardSchedule) throw new Error('window.__guardSchedule not exposed');
  return win.__guardSchedule;
}

const offline = loadOffline();

const baseInput: GenerationInput = {
  posts: [
    {
      id: 'p1',
      name: 'Main',
      defaultHeadcount: 1,
      headcountWindows: [
        { startHour: 18, endHour: 22, headcount: 2 },
        { startHour: 22, endHour: 2, headcount: 1 },
      ],
    },
    { id: 'p2', name: 'Back', defaultHeadcount: 1, headcountWindows: [] },
  ],
  roster: ['a', 'b', 'c', 'd', 'e'].map((id) => ({
    id,
    source: 'firestore' as const,
    displayName: id,
  })),
  config: {
    startAt: '2026-05-02T18:00',
    endAt: '2026-05-03T06:00',
    shiftDurationHours: 2,
    algorithm: 'random_fair',
    seed: 'parity-1',
  },
};

describe('Offline algorithm parity', () => {
  it('expandShifts matches across implementations', () => {
    const tsResult = tsExpandShifts(baseInput.posts, baseInput.config);
    const jsResult = offline.expandShifts(baseInput.posts, baseInput.config);
    expect(jsResult).toEqual(tsResult);
  });

  it('generateSchedule matches with random_fair + fixed seed', () => {
    const ts = tsGenerateSchedule(baseInput);
    const js = offline.generateSchedule(baseInput);
    expect(js.assignments).toEqual(ts.assignments);
    expect(js.shifts).toEqual(ts.shifts);
    expect(js.stats).toEqual(ts.stats);
    expect(js.fairnessScore).toBe(ts.fairnessScore);
  });

  it('generateSchedule matches with round_robin', () => {
    const input = { ...baseInput, config: { ...baseInput.config, algorithm: 'round_robin' as const } };
    const ts = tsGenerateSchedule(input);
    const js = offline.generateSchedule(input);
    expect(js.assignments).toEqual(ts.assignments);
  });

  it('generateSchedule matches with constraint_aware + blackouts', () => {
    const input: GenerationInput = {
      ...baseInput,
      roster: [
        { id: 'a', source: 'firestore', displayName: 'a', blackoutHours: [{ start: '2026-05-02T18:00', end: '2026-05-02T22:00' }] },
        ...baseInput.roster.slice(1),
      ],
      config: { ...baseInput.config, algorithm: 'constraint_aware' as const },
    };
    const ts = tsGenerateSchedule(input);
    const js = offline.generateSchedule(input);
    expect(js.assignments).toEqual(ts.assignments);
  });
});
