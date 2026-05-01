'use client';

import { TEXT_CONSTANTS } from '@/constants/text';
import type { ScheduleAlgorithm, ScheduleConfig } from '@/types/guardSchedule';

const T = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.CONFIG;

const DURATIONS = [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12];

const ALGOS: Array<{ value: ScheduleAlgorithm; label: string; hint: string }> = [
  { value: 'random_fair', label: T.ALGO_RANDOM_FAIR, hint: T.ALGO_RANDOM_FAIR_HINT },
  { value: 'round_robin', label: T.ALGO_ROUND_ROBIN, hint: T.ALGO_ROUND_ROBIN_HINT },
  { value: 'constraint_aware', label: T.ALGO_CONSTRAINT_AWARE, hint: T.ALGO_CONSTRAINT_AWARE_HINT },
];

interface Props {
  config: ScheduleConfig;
  onChange: (next: ScheduleConfig) => void;
}

export default function ScheduleConfigForm({ config, onChange }: Props) {
  const update = (patch: Partial<ScheduleConfig>) => onChange({ ...config, ...patch });

  return (
    <section className="space-y-4">
      <h3 className="text-base font-medium text-neutral-800">{T.TITLE}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col text-sm text-neutral-700">
          <span>{T.START}</span>
          <input
            type="datetime-local"
            className="input-base mt-1"
            value={config.startAt}
            onChange={(e) => update({ startAt: e.target.value })}
          />
        </label>
        <label className="flex flex-col text-sm text-neutral-700">
          <span>{T.END}</span>
          <input
            type="datetime-local"
            className="input-base mt-1"
            value={config.endAt}
            onChange={(e) => update({ endAt: e.target.value })}
          />
        </label>
        <label className="flex flex-col text-sm text-neutral-700">
          <span>{T.SHIFT_DURATION}</span>
          <select
            className="input-base mt-1"
            value={config.shiftDurationHours}
            onChange={(e) => update({ shiftDurationHours: Number(e.target.value) })}
          >
            {DURATIONS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm text-neutral-700">
          <span>{T.SEED_LABEL}</span>
          <input
            type="text"
            className="input-base mt-1"
            placeholder={T.SEED_PLACEHOLDER}
            value={config.seed ?? ''}
            onChange={(e) => update({ seed: e.target.value || undefined })}
          />
        </label>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-800">{T.ALGORITHM}</legend>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {ALGOS.map((algo) => (
            <label
              key={algo.value}
              className={`card-base cursor-pointer p-3 text-sm transition-colors ${
                config.algorithm === algo.value ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="algorithm"
                  className="mt-1"
                  value={algo.value}
                  checked={config.algorithm === algo.value}
                  onChange={() => update({ algorithm: algo.value })}
                />
                <div>
                  <p className="font-medium text-neutral-900">{algo.label}</p>
                  <p className="text-xs text-neutral-500">{algo.hint}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
