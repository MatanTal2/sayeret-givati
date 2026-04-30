'use client';

import React, { useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { X } from 'lucide-react';
import type { Equipment, EquipmentHistoryEntry, ActionsLog } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';
import { getEquipmentActionLogs } from '@/lib/actionsLogService';

interface ActionHistoryPanelProps {
  equipment: Equipment | null;
  onClose: () => void;
}

interface TimelineEntry {
  key: string;
  ts: number;
  date: Date;
  source: 'tracking' | 'log';
  action: string;
  actor?: string;
  holder?: string;
  location?: string;
  note?: string;
  photoUrl?: string;
}

export default function ActionHistoryPanel({ equipment, onClose }: ActionHistoryPanelProps) {
  const [logs, setLogs] = useState<ActionsLog[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!equipment) { setLogs(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEquipmentActionLogs(equipment.id)
      .then((data) => { if (!cancelled) setLogs(data); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [equipment]);

  if (!equipment) return null;

  const timeline = mergeTimeline(equipment.trackingHistory ?? [], logs ?? []);
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.HISTORY_PANEL;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between p-5 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{labels.TITLE}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {equipment.productName} · צ: {equipment.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-neutral-500 hover:bg-neutral-100"
            aria-label={labels.CLOSE}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-neutral-500 text-center py-6">{labels.LOADING}</p>
          ) : error ? (
            <p className="text-sm text-danger-600 text-center py-6">{error}</p>
          ) : timeline.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-6">{labels.EMPTY}</p>
          ) : (
            <ol className="space-y-3">
              {timeline.map((entry) => (
                <li key={entry.key} className="border-s-2 border-primary-200 ps-4 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-900">{entry.action}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {entry.date.toLocaleString('he-IL', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                      <div className="text-sm text-neutral-700 mt-1 space-y-0.5">
                        {entry.actor && <div>👤 {entry.actor}</div>}
                        {entry.holder && entry.holder !== entry.actor && <div>📥 {entry.holder}</div>}
                        {entry.location && <div>📍 {entry.location}</div>}
                        {entry.note && <div className="text-neutral-600">📝 {entry.note}</div>}
                      </div>
                    </div>
                    {entry.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.photoUrl}
                        alt=""
                        className="w-16 h-16 rounded-md object-cover bg-neutral-100"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function mergeTimeline(tracking: EquipmentHistoryEntry[], logs: ActionsLog[]): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  for (const [i, t] of tracking.entries()) {
    const ms = toMs(t.timestamp);
    out.push({
      key: `t-${i}-${ms}`,
      ts: ms,
      date: new Date(ms),
      source: 'tracking',
      action: t.action,
      holder: t.holder,
      location: t.location,
      note: t.notes,
      photoUrl: t.photoUrl,
    });
  }
  for (const log of logs) {
    const ms = toMs(log.timestamp);
    out.push({
      key: `l-${log.id}`,
      ts: ms,
      date: new Date(ms),
      source: 'log',
      action: log.actionType,
      actor: log.actorName,
      holder: log.targetName,
      note: log.note,
    });
  }
  out.sort((a, b) => b.ts - a.ts);
  return out;
}

function toMs(t: Timestamp | Date | string | number | undefined): number {
  if (!t) return 0;
  if (t instanceof Timestamp) return t.toDate().getTime();
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'number') return t;
  return new Date(t).getTime();
}
