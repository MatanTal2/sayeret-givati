'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { useEquipment } from '@/hooks/useEquipment';
import { canForceTransfer } from '@/lib/equipmentPolicy';
import { getActionLogsByType } from '@/lib/actionsLogService';
import { ActionType, type ActionsLog, type Equipment } from '@/types/equipment';
import UserSearchInput from '@/components/users/UserSearchInput';
import type { UserSearchResult } from '@/lib/userService';
import { apiFetch } from '@/lib/apiFetch';

type Kind = 'holder' | 'signer' | 'both';

export default function ForceOperationsTab() {
  const { enhancedUser } = useAuth();
  const { equipment } = useEquipment({ scope: 'all' });
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.FORCE_OPS;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState<Kind>('both');
  const [target, setTarget] = useState<UserSearchResult | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [recent, setRecent] = useState<ActionsLog[]>([]);

  const eligible = useMemo(() => {
    if (!enhancedUser) return [];
    return equipment.filter((e) => canForceTransfer({ user: enhancedUser, equipment: e }));
  }, [equipment, enhancedUser]);

  const filtered = useMemo(() => {
    if (!searchTerm) return eligible;
    const q = searchTerm.toLowerCase();
    return eligible.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.productName.toLowerCase().includes(q) ||
        e.currentHolder.toLowerCase().includes(q),
    );
  }, [eligible, searchTerm]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getActionLogsByType(ActionType.FORCE_TRANSFER_HOLDER, 10),
      getActionLogsByType(ActionType.FORCE_TRANSFER_SIGNER, 10),
    ])
      .then(([h, s]) => {
        if (cancelled) return;
        const merged = [...h, ...s].sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp)).slice(0, 20);
        setRecent(merged);
      })
      .catch(() => { if (!cancelled) setRecent([]); });
    return () => { cancelled = true; };
  }, [feedback]);

  if (!enhancedUser) return null;

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const validate = (): string | null => {
    if (selectedIds.size === 0) return labels.ITEMS_REQUIRED;
    if (!target) return labels.TARGET_REQUIRED;
    if (!reason.trim()) return labels.REASON_REQUIRED;
    return null;
  };

  const execute = async () => {
    setFeedback(null);
    const err = validate();
    if (err) { setFeedback({ ok: false, msg: err }); return; }
    setSubmitting(true);
    try {
      const actorUserName =
        enhancedUser.displayName ||
        [enhancedUser.firstName, enhancedUser.lastName].filter(Boolean).join(' ') ||
        enhancedUser.uid;
      const res = await apiFetch('/api/force-ops', {
        method: 'POST',
        body: JSON.stringify({
          actorUserName,
          equipmentDocIds: Array.from(selectedIds),
          kind,
          targetUserId: target!.uid,
          reason: reason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || labels.ERROR);
      const n = (json.updatedDocIds as string[] | undefined)?.length ?? selectedIds.size;
      setFeedback({ ok: true, msg: labels.SUCCESS.replace('{n}', String(n)) });
      setSelectedIds(new Set());
      setTarget(null);
      setReason('');
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : labels.ERROR });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-warning-700 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-warning-800">{labels.WARNING}</p>
      </div>

      <Section title={labels.STEP_PICK_ITEMS} hint={labels.SELECT_ITEMS_HINT}>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={labels.SEARCH_PLACEHOLDER}
          className="w-full px-3 py-2 mb-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 focus:ring-2 focus:ring-primary-500"
        />
        <div className="border border-neutral-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
          <ItemList items={filtered} selectedIds={selectedIds} onToggle={toggleId} />
        </div>
        <p className="text-xs text-neutral-500 mt-1">{labels.SELECTED_COUNT.replace('{n}', String(selectedIds.size))}</p>
      </Section>

      <Section title={labels.STEP_KIND}>
        <div className="grid grid-cols-3 gap-2">
          {(['holder', 'signer', 'both'] as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`p-3 rounded-lg border text-sm transition-all ${
                kind === k
                  ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                  : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {k === 'holder' ? labels.KIND_HOLDER : k === 'signer' ? labels.KIND_SIGNER : labels.KIND_BOTH}
            </button>
          ))}
        </div>
      </Section>

      <Section title={labels.STEP_TARGET}>
        <UserSearchInput
          value={target}
          onChange={setTarget}
          placeholder={labels.TARGET_PLACEHOLDER}
          excludeUserIds={[enhancedUser.uid]}
        />
      </Section>

      <Section title={labels.STEP_REASON}>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={labels.REASON_PLACEHOLDER}
          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </Section>

      {feedback && (
        <div
          className={`rounded-lg p-3 flex items-start gap-2 ${
            feedback.ok ? 'bg-success-50 border border-success-200' : 'bg-danger-50 border border-danger-200'
          }`}
        >
          {feedback.ok ? (
            <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-danger-600 mt-0.5" />
          )}
          <p className={`text-sm ${feedback.ok ? 'text-success-800' : 'text-danger-800'}`}>{feedback.msg}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={execute}
          disabled={submitting}
          className="px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? labels.EXECUTING : labels.EXECUTE}
        </button>
      </div>

      <RecentList recent={recent} />
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-sm font-medium text-neutral-700 mb-2">{title}</h4>
      {hint && <p className="text-xs text-neutral-500 mb-2">{hint}</p>}
      {children}
    </section>
  );
}

function ItemList({
  items,
  selectedIds,
  onToggle,
}: {
  items: Equipment[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) {
    return <div className="p-4 text-sm text-neutral-500 text-center">—</div>;
  }
  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((e) => (
        <li key={e.id}>
          <label className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.has(e.id)}
              onChange={() => onToggle(e.id)}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1 text-sm">
              <div className="font-medium text-neutral-900">צ: {e.id} · {e.productName}</div>
              <div className="text-xs text-neutral-500">
                מחזיק: {e.currentHolder} · חתום: {e.signedBy}
              </div>
            </div>
          </label>
        </li>
      ))}
    </ul>
  );
}

function RecentList({ recent }: { recent: ActionsLog[] }) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.FORCE_OPS;
  return (
    <section>
      <h4 className="text-sm font-medium text-neutral-700 mb-2">{labels.RECENT_TITLE}</h4>
      {recent.length === 0 ? (
        <p className="text-xs text-neutral-500">{labels.RECENT_EMPTY}</p>
      ) : (
        <ul className="space-y-1">
          {recent.map((log) => (
            <li key={log.id} className="px-3 py-2 bg-white border border-neutral-200 rounded-md text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900">{log.equipmentName}</span>
                <span className="text-xs text-neutral-500">{formatDate(log.timestamp)}</span>
              </div>
              <div className="text-xs text-neutral-600 mt-0.5">
                {log.actionType === ActionType.FORCE_TRANSFER_HOLDER ? 'החלפת מחזיק' : 'החלפת חתום'} · {log.actorName}
                {log.targetName ? ` → ${log.targetName}` : ''}
              </div>
              {log.note && <div className="text-xs text-neutral-500 mt-0.5">📝 {log.note}</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function toMs(t: Timestamp | Date | string | number | undefined): number {
  if (!t) return 0;
  if (t instanceof Timestamp) return t.toDate().getTime();
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'number') return t;
  return new Date(t).getTime();
}

function formatDate(t: Timestamp | Date | string | undefined): string {
  return new Date(toMs(t)).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
