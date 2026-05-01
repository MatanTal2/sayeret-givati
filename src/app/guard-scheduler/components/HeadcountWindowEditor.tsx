'use client';

import { TEXT_CONSTANTS } from '@/constants/text';
import type { HeadcountWindow } from '@/types/guardSchedule';

const T = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.POSTS;

interface Props {
  windows: HeadcountWindow[];
  onChange: (next: HeadcountWindow[]) => void;
}

const HOURS_24 = Array.from({ length: 25 }, (_, i) => i);

function hasOverlap(windows: HeadcountWindow[]): boolean {
  // Treat each window as a set of integer hour buckets covered.
  const seen = new Set<number>();
  for (const w of windows) {
    const buckets: number[] = [];
    if (w.startHour < w.endHour) {
      for (let h = w.startHour; h < w.endHour; h++) buckets.push(h);
    } else if (w.startHour > w.endHour) {
      for (let h = w.startHour; h < 24; h++) buckets.push(h);
      for (let h = 0; h < w.endHour; h++) buckets.push(h);
    }
    for (const b of buckets) {
      if (seen.has(b)) return true;
      seen.add(b);
    }
  }
  return false;
}

export default function HeadcountWindowEditor({ windows, onChange }: Props) {
  const overlap = hasOverlap(windows);

  const update = (idx: number, patch: Partial<HeadcountWindow>) => {
    onChange(windows.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  };
  const remove = (idx: number) => onChange(windows.filter((_, i) => i !== idx));
  const add = () => onChange([...windows, { startHour: 0, endHour: 6, headcount: 1 }]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-700">{T.WINDOWS_TITLE}</h4>
        <button type="button" onClick={add} className="btn-secondary text-sm">
          {T.WINDOW_ADD}
        </button>
      </div>
      {windows.length === 0 && (
        <p className="text-xs text-neutral-500">{T.WINDOWS_HINT}</p>
      )}
      {windows.map((w, idx) => (
        <div
          key={idx}
          className="flex flex-wrap items-end gap-2 rounded-xl border border-neutral-200 p-3"
        >
          <label className="flex flex-col text-xs text-neutral-600">
            <span>{T.START_HOUR}</span>
            <select
              className="input-base mt-1 w-24"
              value={w.startHour}
              onChange={(e) => update(idx, { startHour: Number(e.target.value) })}
            >
              {HOURS_24.slice(0, 24).map((h) => (
                <option key={h} value={h}>{`${h}:00`}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs text-neutral-600">
            <span>{T.END_HOUR}</span>
            <select
              className="input-base mt-1 w-24"
              value={w.endHour}
              onChange={(e) => update(idx, { endHour: Number(e.target.value) })}
            >
              {HOURS_24.slice(1).map((h) => (
                <option key={h} value={h}>{`${h}:00`}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs text-neutral-600">
            <span>{T.COUNT}</span>
            <input
              type="number"
              min={0}
              className="input-base mt-1 w-24"
              value={w.headcount}
              onChange={(e) => update(idx, { headcount: Math.max(0, Number(e.target.value)) })}
            />
          </label>
          <button type="button" onClick={() => remove(idx)} className="btn-ghost text-sm">
            {T.WINDOW_REMOVE}
          </button>
        </div>
      ))}
      {overlap && (
        <p role="alert" className="text-sm text-danger-600">{T.OVERLAP_ERROR}</p>
      )}
    </div>
  );
}
