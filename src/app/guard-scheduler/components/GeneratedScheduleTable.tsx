'use client';

import { useMemo, useState } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import type {
  GenerationResult,
  RosterPerson,
  ScheduleWarning,
  Shift,
} from '@/types/guardSchedule';
import ManualSwapDialog from './ManualSwapDialog';

const T = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.PREVIEW;
const W = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.WARNINGS;

const HEBREW_DAY = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function pad(n: number) { return n.toString().padStart(2, '0'); }
function parseLocal(s: string): Date {
  const [d, t] = s.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return new Date(y, mo - 1, da, h, mi);
}
function fmtDay(s: string): string {
  const d = parseLocal(s);
  return `${HEBREW_DAY[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}
function fmtTime(s: string): string {
  const d = parseLocal(s);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function warningLabel(code: ScheduleWarning['code']): string {
  switch (code) {
    case 'roster_too_small': return W.ROSTER_TOO_SMALL;
    case 'cannot_meet_headcount': return W.CANNOT_MEET_HEADCOUNT;
    case 'blackout_overrun': return W.BLACKOUT_OVERRUN;
    default: return code;
  }
}

interface Props {
  result: GenerationResult;
  roster: RosterPerson[];
  onSwap: (shiftId: string, fromPersonId: string, toPersonId: string) => void;
  onLockToggle: (shiftId: string, locked: boolean) => void;
  onRegenerateFresh: () => void;
  onRegenerateKeepLocks: () => void;
}

export default function GeneratedScheduleTable({
  result,
  roster,
  onSwap,
  onLockToggle,
  onRegenerateFresh,
  onRegenerateKeepLocks,
}: Props) {
  const personById = useMemo(() => new Map(roster.map((p) => [p.id, p])), [roster]);
  const shiftById = useMemo(() => new Map(result.shifts.map((s) => [s.id, s])), [result.shifts]);
  const sorted = useMemo(
    () =>
      result.assignments
        .map((a) => ({ a, shift: shiftById.get(a.shiftId) as Shift | undefined }))
        .filter((row): row is { a: typeof row.a; shift: Shift } => !!row.shift)
        .sort((x, y) =>
          x.shift.start === y.shift.start
            ? x.shift.postName.localeCompare(y.shift.postName, 'he')
            : x.shift.start.localeCompare(y.shift.start),
        ),
    [result.assignments, shiftById],
  );

  const [swapTarget, setSwapTarget] = useState<{ shiftId: string; personId: string } | null>(null);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-medium text-neutral-800">{T.TITLE}</h3>
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <span>{T.FAIRNESS.replace('{value}', String(result.fairnessScore))}</span>
          <button type="button" className="btn-ghost" onClick={onRegenerateKeepLocks}>{T.REGENERATE_KEEP_LOCKS}</button>
          <button type="button" className="btn-ghost" onClick={onRegenerateFresh}>{T.REGENERATE_FRESH}</button>
        </div>
      </header>

      {result.warnings.length > 0 && (
        <ul role="alert" aria-live="polite" className="card-base p-3 space-y-1">
          <li className="text-sm font-medium text-warning-700">{T.WARNINGS_TITLE}</li>
          {result.warnings.map((w, i) => (
            <li key={i} className="text-sm text-warning-600">• {warningLabel(w.code)}</li>
          ))}
        </ul>
      )}

      <div className="card-base overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-right text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2">{T.COL_DAY}</th>
              <th className="px-3 py-2">{T.COL_TIME}</th>
              <th className="px-3 py-2">{T.COL_POST}</th>
              <th className="px-3 py-2">{T.COL_PEOPLE}</th>
              <th className="px-3 py-2">{T.COL_LOCK}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sorted.map(({ a, shift }) => (
              <tr key={a.shiftId}>
                <td className="px-3 py-2 text-neutral-700">{fmtDay(shift.start)}</td>
                <td className="px-3 py-2 text-neutral-700">
                  {fmtTime(shift.start)}–{fmtTime(shift.end)}
                </td>
                <td className="px-3 py-2 text-neutral-800">{shift.postName}</td>
                <td className="px-3 py-2">
                  <ul className="flex flex-wrap gap-1">
                    {a.personIds.map((pid) => (
                      <li key={pid}>
                        <button
                          type="button"
                          onClick={() => setSwapTarget({ shiftId: a.shiftId, personId: pid })}
                          className="badge-base bg-neutral-100 text-neutral-800 hover:bg-primary-100 hover:text-primary-800"
                          aria-label={`${T.SWAP}: ${personById.get(pid)?.displayName ?? pid}`}
                        >
                          {personById.get(pid)?.displayName ?? pid}
                        </button>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onLockToggle(a.shiftId, !a.locked)}
                    className="btn-ghost text-xs"
                    aria-pressed={a.locked}
                  >
                    {a.locked ? T.UNLOCK : T.LOCK}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {swapTarget && (() => {
        const fromPerson = personById.get(swapTarget.personId);
        if (!fromPerson) return null;
        const assignment = result.assignments.find((a) => a.shiftId === swapTarget.shiftId);
        const alreadyOnShift = assignment?.personIds ?? [];
        return (
          <ManualSwapDialog
            fromPerson={fromPerson}
            roster={roster}
            alreadyOnShift={alreadyOnShift}
            onCancel={() => setSwapTarget(null)}
            onConfirm={(toId) => {
              onSwap(swapTarget.shiftId, swapTarget.personId, toId);
              setSwapTarget(null);
            }}
          />
        );
      })()}
    </section>
  );
}
