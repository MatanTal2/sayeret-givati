'use client';

import { useState } from 'react';
import { useOutbox } from '@/contexts/OutboxContext';
import ConflictCenter from '@/components/conflicts/ConflictCenter';

/**
 * Compact pending-queue indicator. Renders nothing when the queue is empty.
 *
 * Click behavior:
 *  - If there are conflicts, opens the `ConflictCenter` dialog.
 *  - Otherwise triggers a manual drain (useful when a stuck retry is queued).
 *
 * Phase 8 will replace this with a dedicated Settings → Offline diagnostics
 * page. For now it's a passive badge.
 */
export default function SyncStatusIndicator() {
  const { pendingCount, conflictCount, stuckCount, drain } = useOutbox();
  const [conflictsOpen, setConflictsOpen] = useState(false);
  const total = pendingCount + conflictCount + stuckCount;

  if (total === 0) return null;

  const tone =
    conflictCount > 0 || stuckCount > 0
      ? 'bg-warning-500 text-neutral-900'
      : 'bg-neutral-900 text-white';

  const onClick = () => {
    if (conflictCount > 0) {
      setConflictsOpen(true);
      return;
    }
    void drain();
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={`fixed bottom-6 end-6 z-[9990] rounded-full shadow-medium px-3 py-1.5 text-xs font-medium ${tone}`}
        aria-label={`Offline queue: ${total} items`}
        title={
          `pending: ${pendingCount}` +
          (conflictCount ? `, conflicts: ${conflictCount}` : '') +
          (stuckCount ? `, stuck: ${stuckCount}` : '')
        }
      >
        ⇅ {total}
      </button>
      <ConflictCenter open={conflictsOpen} onClose={() => setConflictsOpen(false)} />
    </>
  );
}
