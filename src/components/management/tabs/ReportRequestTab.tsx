'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { useEquipment } from '@/hooks/useEquipment';
import {
  type ReportRequestDoc,
  ReportRequestScope,
  ReportRequestStatus,
} from '@/types/equipment';
import {
  createReportRequest,
  getReportRequestsByRequester,
} from '@/lib/reportRequestService';
import UserSearchInput from '@/components/users/UserSearchInput';
import type { UserSearchResult } from '@/lib/userService';
import type { ApiActor } from '@/lib/equipmentService';

export default function ReportRequestTab() {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.REPORT_REQUEST;
  const { enhancedUser } = useAuth();
  const { equipment } = useEquipment({ scope: 'all' });

  const [scope, setScope] = useState<ReportRequestScope>(ReportRequestScope.USER);
  const [target, setTarget] = useState<UserSearchResult | null>(null);
  const [itemsCsv, setItemsCsv] = useState('');
  const [teamId, setTeamId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [recent, setRecent] = useState<ReportRequestDoc[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const loadRecent = useCallback(async () => {
    if (!enhancedUser) return;
    setLoadingRecent(true);
    try {
      const list = await getReportRequestsByRequester(enhancedUser.uid);
      setRecent(list.slice(0, 20));
    } finally {
      setLoadingRecent(false);
    }
  }, [enhancedUser]);

  useEffect(() => { loadRecent(); }, [loadRecent, feedback]);

  const itemTargets = useMemo(() => {
    if (scope !== ReportRequestScope.ITEMS) return null;
    const ids = itemsCsv.split(',').map((s) => s.trim()).filter(Boolean);
    const matched = ids.map((id) => equipment.find((e) => e.id === id)).filter(Boolean);
    const holderIds = Array.from(new Set(matched.map((m) => m!.currentHolderId)));
    return { ids, holderIds };
  }, [scope, itemsCsv, equipment]);

  const validate = (): string | null => {
    if (scope === ReportRequestScope.USER && !target) return labels.TARGET_REQUIRED;
    if (scope === ReportRequestScope.ITEMS) {
      if (!itemTargets || itemTargets.ids.length === 0) return labels.ITEMS_REQUIRED;
    }
    if (scope === ReportRequestScope.TEAM && !teamId.trim()) return labels.TEAM_REQUIRED;
    return null;
  };

  const submit = async () => {
    setFeedback(null);
    const err = validate();
    if (err) { setFeedback({ ok: false, msg: err }); return; }
    if (!enhancedUser) return;
    setSubmitting(true);
    try {
      const actor: ApiActor = {
        uid: enhancedUser.uid,
        userType: enhancedUser.userType!,
        teamId: enhancedUser.teamId,
        displayName:
          enhancedUser.displayName ||
          [enhancedUser.firstName, enhancedUser.lastName].filter(Boolean).join(' ') ||
          undefined,
      };
      const requestedByUserName = actor.displayName || actor.uid;

      const targetUserIds = computeTargetUserIds(scope, target, itemTargets?.holderIds ?? []);
      if (targetUserIds.length === 0) throw new Error(labels.TARGET_REQUIRED);

      await createReportRequest({
        actor,
        scope,
        targetUserIds,
        targetEquipmentDocIds: scope === ReportRequestScope.ITEMS ? itemTargets!.ids : undefined,
        targetTeamId: scope === ReportRequestScope.TEAM ? teamId.trim() : undefined,
        requestedByUserName,
        note: note.trim() || undefined,
      });
      setFeedback({ ok: true, msg: labels.SUCCESS });
      setTarget(null);
      setItemsCsv('');
      setTeamId('');
      setNote('');
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : labels.ERROR });
    } finally {
      setSubmitting(false);
    }
  };

  if (!enhancedUser) return null;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-neutral-200 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.SCOPE_LABEL}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ScopeButton current={scope} value={ReportRequestScope.USER} label={labels.SCOPE_USER} onChange={setScope} />
            <ScopeButton current={scope} value={ReportRequestScope.ITEMS} label={labels.SCOPE_ITEMS} onChange={setScope} />
            <ScopeButton current={scope} value={ReportRequestScope.TEAM} label={labels.SCOPE_TEAM} onChange={setScope} />
            <ScopeButton current={scope} value={ReportRequestScope.ALL} label={labels.SCOPE_ALL} onChange={setScope} />
          </div>
        </div>

        {scope === ReportRequestScope.USER && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.TARGET_USER_LABEL}</label>
            <UserSearchInput value={target} onChange={setTarget} placeholder={labels.TARGET_USER_PLACEHOLDER} />
          </div>
        )}
        {scope === ReportRequestScope.ITEMS && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.TARGET_ITEMS_LABEL}</label>
            <textarea
              rows={2}
              value={itemsCsv}
              onChange={(e) => setItemsCsv(e.target.value)}
              placeholder={labels.TARGET_ITEMS_PLACEHOLDER}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {itemTargets && (
              <p className="text-xs text-neutral-500 mt-1">
                {itemTargets.ids.length} פריטים · {itemTargets.holderIds.length} מחזיקים ייעודכנו
              </p>
            )}
          </div>
        )}
        {scope === ReportRequestScope.TEAM && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.TARGET_TEAM_LABEL}</label>
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder={labels.TARGET_TEAM_PLACEHOLDER}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.NOTE_LABEL}</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={labels.NOTE_PLACEHOLDER}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

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
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? labels.SUBMITTING : labels.SUBMIT}
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-neutral-700">{labels.RECENT_TITLE}</h4>
          <button
            type="button"
            onClick={loadRecent}
            disabled={loadingRecent}
            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRecent ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {loadingRecent ? (
          <p className="text-xs text-neutral-500">...</p>
        ) : recent.length === 0 ? (
          <p className="text-xs text-neutral-500">{labels.RECENT_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => (
              <RecentRow key={r.id} request={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ScopeButton({
  current,
  value,
  label,
  onChange,
}: {
  current: ReportRequestScope;
  value: ReportRequestScope;
  label: string;
  onChange: (s: ReportRequestScope) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`p-2 text-sm rounded-lg border transition-colors ${
        active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 hover:bg-neutral-50'
      }`}
    >
      {label}
    </button>
  );
}

function RecentRow({ request }: { request: ReportRequestDoc }) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.REPORT_REQUEST;
  const total = request.targetUserIds.length;
  const fulfilled = Object.values(request.fulfillmentByUser ?? {}).filter((f) => f.fulfilled).length;
  return (
    <li className="px-3 py-2 bg-white border border-neutral-200 rounded-md">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm">
          <div className="font-medium text-neutral-900">
            {scopeLabel(request.scope, labels)}
            {request.note && <span className="text-neutral-500 font-normal"> · {request.note}</span>}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            {labels.FULFILLMENT_LABEL}: {fulfilled}/{total}
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>
    </li>
  );
}

function scopeLabel(s: ReportRequestScope, labels: typeof TEXT_CONSTANTS.FEATURES.EQUIPMENT.REPORT_REQUEST): string {
  switch (s) {
    case ReportRequestScope.USER: return labels.SCOPE_USER;
    case ReportRequestScope.ITEMS: return labels.SCOPE_ITEMS;
    case ReportRequestScope.TEAM: return labels.SCOPE_TEAM;
    case ReportRequestScope.ALL: return labels.SCOPE_ALL;
  }
}

function StatusBadge({ status }: { status: ReportRequestStatus }) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.REPORT_REQUEST;
  const map: Record<ReportRequestStatus, { label: string; cls: string }> = {
    [ReportRequestStatus.PENDING]: { label: labels.STATUS_PENDING, cls: 'bg-warning-100 text-warning-800' },
    [ReportRequestStatus.PARTIALLY_FULFILLED]: { label: labels.STATUS_PARTIAL, cls: 'bg-info-100 text-info-800' },
    [ReportRequestStatus.FULFILLED]: { label: labels.STATUS_FULFILLED, cls: 'bg-success-100 text-success-800' },
    [ReportRequestStatus.EXPIRED]: { label: labels.STATUS_EXPIRED, cls: 'bg-neutral-100 text-neutral-700' },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function computeTargetUserIds(
  scope: ReportRequestScope,
  target: UserSearchResult | null,
  itemHolderIds: string[],
): string[] {
  switch (scope) {
    case ReportRequestScope.USER: return target ? [target.uid] : [];
    case ReportRequestScope.ITEMS: return itemHolderIds;
    case ReportRequestScope.TEAM:
    case ReportRequestScope.ALL:
      // Server resolves the user list from teamId / 'all'. Client passes empty array;
      // route validator will reject if the server expects pre-materialized IDs — that case
      // is tracked as a Phase 7 wiring gap.
      return [];
  }
}

