'use client';

import React, { useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { X } from 'lucide-react';
import type { Equipment, EquipmentHistoryEntry, ActionsLog } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';
import { getEquipmentActionLogs } from '@/lib/actionsLogService';
import { EquipmentService } from '@/lib/equipmentService';
import { equipmentSerialDisplay } from '@/utils/equipmentDisplay';
import { cn } from '@/lib/cn';

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
  /** Doc this entry came from. Distinguishes predecessor history from current. */
  ownerDocId: string;
  isPredecessor: boolean;
}

const EXCHANGE_ACTIONS = new Set([
  'exchange_requested',
  'exchange_approved',
  'exchange_rejected',
  'exchange_completed',
]);
const STORAGE_ACTIONS = new Set(['stored', 'reissued']);

function rowBgClass(action: string): string {
  const key = action.toLowerCase();
  if (EXCHANGE_ACTIONS.has(key)) return 'bg-primary-50';
  if (STORAGE_ACTIONS.has(key)) return 'bg-info-50';
  return '';
}

export default function ActionHistoryPanel({ equipment, onClose }: ActionHistoryPanelProps) {
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predecessorChain, setPredecessorChain] = useState<string[]>([]);

  useEffect(() => {
    if (!equipment) { setTimeline(null); setPredecessorChain([]); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Walk the predecessor chain. Guard against cycles + runaway depth.
        const visited = new Set<string>();
        const chain: { docId: string; eq: Equipment; isPredecessor: boolean }[] = [
          { docId: equipment.id, eq: equipment, isPredecessor: false },
        ];
        visited.add(equipment.id);
        let cursor = equipment.predecessorDocId;
        let depth = 0;
        while (cursor && !visited.has(cursor) && depth < 10) {
          visited.add(cursor);
          depth += 1;
          const res = await EquipmentService.Items.getEquipment(cursor);
          if (!res.success || !res.data) break;
          const eq = res.data as Equipment;
          chain.push({ docId: eq.id, eq, isPredecessor: true });
          cursor = eq.predecessorDocId;
        }

        // Fetch action logs for each doc in parallel.
        const logsList = await Promise.all(
          chain.map((c) => getEquipmentActionLogs(c.docId).catch(() => [] as ActionsLog[]))
        );

        if (cancelled) return;

        const merged: TimelineEntry[] = [];
        chain.forEach((c, idx) => {
          merged.push(
            ...buildEntries(c.eq.trackingHistory ?? [], logsList[idx], c.docId, c.isPredecessor)
          );
        });
        merged.sort((a, b) => b.ts - a.ts);
        setTimeline(merged);
        setPredecessorChain(chain.filter((c) => c.isPredecessor).map((c) => c.docId));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [equipment]);

  if (!equipment) return null;

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
              {equipment.productName}
              {(() => {
                const serial = equipmentSerialDisplay(equipment);
                return serial ? ` · צ: ${serial}` : '';
              })()}
            </p>
            {predecessorChain.length > 0 && (
              <p className="mt-1 text-xs text-primary-700 bg-primary-50 inline-block px-2 py-0.5 rounded-full">
                {TEXT_CONSTANTS.FEATURES.EQUIPMENT.EXCHANGE.PREDECESSOR_PILL.replace(
                  '{serial}',
                  predecessorChain[0]
                )}
              </p>
            )}
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
          ) : !timeline || timeline.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-6">{labels.EMPTY}</p>
          ) : (
            <ol className="space-y-3">
              {timeline.map((entry) => (
                <li
                  key={entry.key}
                  className={cn(
                    'border-s-2 border-primary-200 ps-4 py-2 rounded-md transition-colors',
                    rowBgClass(entry.action),
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">{entry.action}</span>
                        {entry.isPredecessor && (
                          <span className="text-[10px] uppercase tracking-wider text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                            {labels.PREDECESSOR_BADGE}
                          </span>
                        )}
                      </div>
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

function buildEntries(
  tracking: EquipmentHistoryEntry[],
  logs: ActionsLog[],
  ownerDocId: string,
  isPredecessor: boolean,
): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  for (const [i, t] of tracking.entries()) {
    const ms = toMs(t.timestamp);
    out.push({
      key: `t-${ownerDocId}-${i}-${ms}`,
      ts: ms,
      date: new Date(ms),
      source: 'tracking',
      action: t.action,
      holder: t.holder,
      location: t.location,
      note: t.notes,
      photoUrl: t.photoUrl,
      ownerDocId,
      isPredecessor,
    });
  }
  for (const log of logs) {
    const ms = toMs(log.timestamp);
    out.push({
      key: `l-${ownerDocId}-${log.id}`,
      ts: ms,
      date: new Date(ms),
      source: 'log',
      action: log.actionType,
      actor: log.actorName,
      holder: log.targetName,
      note: log.note,
      ownerDocId,
      isPredecessor,
    });
  }
  return out;
}

function toMs(t: Timestamp | Date | string | number | undefined): number {
  if (!t) return 0;
  if (t instanceof Timestamp) return t.toDate().getTime();
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'number') return t;
  return new Date(t).getTime();
}
