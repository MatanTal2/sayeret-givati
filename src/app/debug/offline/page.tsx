'use client';

import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useOutbox } from '@/contexts/OutboxContext';
import { drainOutbox } from '@/lib/offline/replay';
import { listAll, removeById, type OutboxEntry } from '@/lib/offline/outbox';

/**
 * Diagnostic page for the offline outbox. **Development only.** Audit note
 * N6: guarded at the route file level so it cannot be reached in prod
 * builds — `process.env.NODE_ENV !== 'production'` is read at module-load
 * time and the page short-circuits to `notFound()` if prod.
 */
export default function OfflineDebugPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const { entries, pendingCount, conflictCount, stuckCount } = useOutbox();
  const [all, setAll] = useState<OutboxEntry[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    void listAll().then(setAll);
  }, [entries]);

  const onDrain = async () => {
    setRunning(true);
    try { await drainOutbox(); } finally { setRunning(false); }
  };

  const onRemove = async (id: number | undefined) => {
    if (id === undefined) return;
    await removeById(id);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Offline outbox — debug</h1>
      <p className="text-sm text-neutral-600">
        Dev-only diagnostic. Spec: <code>docs/spec/offline-first.md</code> Phase 8.
      </p>

      <div className="flex gap-3 text-sm">
        <Stat label="Pending" value={pendingCount} tone="info" />
        <Stat label="Conflict" value={conflictCount} tone="warning" />
        <Stat label="Stuck / poisoned" value={stuckCount} tone="danger" />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="btn-primary text-sm"
          onClick={() => { void onDrain(); }}
          disabled={running}
        >
          {running ? 'Draining…' : 'Force drain'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-neutral-100">
            <tr>
              <th className="text-start px-2 py-1">id</th>
              <th className="text-start px-2 py-1">route</th>
              <th className="text-start px-2 py-1">status</th>
              <th className="text-start px-2 py-1">attempts</th>
              <th className="text-start px-2 py-1">lastError</th>
              <th className="text-start px-2 py-1">resourceKey</th>
              <th className="text-start px-2 py-1">actions</th>
            </tr>
          </thead>
          <tbody>
            {all.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-3 text-neutral-500 text-center">
                  (queue empty)
                </td>
              </tr>
            )}
            {all.map((e) => (
              <tr key={e.id} className="border-t border-neutral-200 align-top">
                <td className="px-2 py-1 font-mono">{e.id}</td>
                <td className="px-2 py-1 font-mono">{e.routeName}</td>
                <td className="px-2 py-1">{e.status}</td>
                <td className="px-2 py-1">{e.attempts}</td>
                <td className="px-2 py-1 text-danger-600 font-mono">{e.lastError ?? '—'}</td>
                <td className="px-2 py-1 font-mono">{e.resourceKey ?? '—'}</td>
                <td className="px-2 py-1">
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => { void onRemove(e.id); }}
                  >
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'info' | 'warning' | 'danger' }) {
  const toneClass = {
    info: 'bg-info-50 text-info-700',
    warning: 'bg-warning-50 text-warning-700',
    danger: 'bg-danger-50 text-danger-700',
  }[tone];
  return (
    <div className={`rounded-lg px-3 py-2 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
