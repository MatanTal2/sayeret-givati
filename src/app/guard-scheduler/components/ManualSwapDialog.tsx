'use client';

import { useState } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import type { RosterPerson } from '@/types/guardSchedule';

const T = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.SWAP_DIALOG;

interface Props {
  fromPerson: RosterPerson;
  roster: RosterPerson[];
  alreadyOnShift: string[];
  onCancel: () => void;
  onConfirm: (toPersonId: string) => void;
}

export default function ManualSwapDialog({ fromPerson, roster, alreadyOnShift, onCancel, onConfirm }: Props) {
  const candidates = roster.filter((p) => p.id !== fromPerson.id && !alreadyOnShift.includes(p.id));
  const [toId, setToId] = useState<string>(candidates[0]?.id ?? '');

  return (
    <>
      <div className="modal-overlay" onClick={onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-title"
        className="fixed left-1/2 top-1/2 z-50 w-[min(420px,90vw)] -translate-x-1/2 -translate-y-1/2 card-base p-5 modal-enter"
      >
        <h2 id="swap-title" className="text-lg font-semibold text-neutral-900">{T.TITLE}</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {T.FROM_LABEL}: <strong>{fromPerson.displayName}</strong>
        </p>
        <label className="mt-3 block text-sm text-neutral-700">
          <span>{T.TO_LABEL}</span>
          <select
            className="input-base mt-1"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            disabled={candidates.length === 0}
          >
            {candidates.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName}</option>
            ))}
          </select>
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>{T.CANCEL}</button>
          <button
            type="button"
            className="btn-primary"
            disabled={!toId}
            onClick={() => onConfirm(toId)}
          >
            {T.APPLY}
          </button>
        </div>
      </div>
    </>
  );
}
