'use client';

import React, { useMemo, useState } from 'react';
import { Plus, X, AlertCircle, Check, XCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { useAmmunitionTemplates } from '@/hooks/useAmmunitionTemplates';
import { useAmmunitionReportRequests } from '@/hooks/useAmmunitionReportRequests';
import UserSearchInput from '@/components/users/UserSearchInput';
import type { UserSearchResult } from '@/lib/userService';
import type {
  AmmunitionReportRequest,
  AmmunitionReportRequestScope,
} from '@/types/ammunition';

type ScopeChoice =
  | { kind: 'INDIVIDUAL'; user: UserSearchResult | null }
  | { kind: 'TEAM'; teamId: string }
  | { kind: 'ALL' };

function tsToMs(ts: unknown): number {
  if (!ts) return 0;
  const maybeDate = (ts as { toDate?: () => Date }).toDate;
  if (typeof maybeDate === 'function') return maybeDate.call(ts).getTime();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  const d = new Date(String(ts));
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function fmtDate(ts: unknown): string {
  const ms = tsToMs(ts);
  if (!ms) return '—';
  return new Date(ms).toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(s: string): string {
  if (s === 'OPEN') return 'פתוחה';
  if (s === 'CLOSED') return 'הושלמה';
  if (s === 'CANCELED') return 'בוטלה';
  return s;
}

export default function AmmunitionRequestsSection() {
  const { enhancedUser } = useAuth();
  const { templates } = useAmmunitionTemplates();
  const { requests, isLoading, error, create, cancel } = useAmmunitionReportRequests();
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const isManagerOrTL =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER ||
    enhancedUser?.userType === UserType.TEAM_LEADER;

  const sorted = useMemo(
    () => [...requests].sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt)),
    [requests]
  );

  const showToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancel = async (id: string) => {
    setSubmitting(true);
    const ok = await cancel(id);
    setSubmitting(false);
    showToast(ok ? 'success' : 'error', ok ? 'הבקשה בוטלה' : 'ביטול נכשל');
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {toast && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            toast.kind === 'success'
              ? 'bg-success-50 border border-success-200 text-success-800'
              : 'bg-danger-50 border border-danger-200 text-danger-800'
          }`}
        >
          {toast.kind === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {isManagerOrTL && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 ms-1" /> בקשת דיווח חדשה
          </Button>
          <span className="text-xs text-neutral-500">סה&quot;כ {requests.length} בקשות</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-neutral-500 text-center py-12">טוען...</div>
      ) : sorted.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-10 border border-dashed border-neutral-200 rounded-lg">
          אין בקשות
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              templates={templates}
              canCancel={isManagerOrTL && r.status === 'OPEN'}
              cancelling={submitting}
              onCancel={() => handleCancel(r.id)}
            />
          ))}
        </ul>
      )}

      {showCreate && (
        <CreateRequestModal
          templates={templates}
          defaultTeamId={enhancedUser?.teamId}
          onClose={() => setShowCreate(false)}
          onCreate={async (payload) => {
            setSubmitting(true);
            const result = await create(payload);
            setSubmitting(false);
            if (result.ok) {
              showToast('success', 'הבקשה נוצרה');
              setShowCreate(false);
            } else {
              showToast('error', 'יצירת בקשה נכשלה');
            }
          }}
        />
      )}
    </div>
  );
}

function RequestCard({
  request,
  templates,
  canCancel,
  cancelling,
  onCancel,
}: {
  request: AmmunitionReportRequest;
  templates: ReturnType<typeof useAmmunitionTemplates>['templates'];
  canCancel: boolean;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const total = Object.keys(request.fulfillmentByUser || {}).length;
  const fulfilled = Object.values(request.fulfillmentByUser || {}).filter((f) => f.fulfilled).length;
  const templateNames = (request.templateIds || [])
    .map((id) => templates.find((t) => t.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-neutral-900">
              {request.scope === 'INDIVIDUAL'
                ? 'אישית'
                : request.scope === 'TEAM'
                  ? `צוות ${request.targetTeamId || ''}`
                  : 'כל המערכת'}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                request.status === 'OPEN'
                  ? 'bg-info-100 text-info-800'
                  : request.status === 'CLOSED'
                    ? 'bg-success-100 text-success-800'
                    : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {statusLabel(request.status)}
            </span>
            <span className="text-xs text-neutral-500">{fmtDate(request.createdAt)}</span>
          </div>

          <div className="text-xs text-neutral-600 mt-1">
            מאת {request.requestedByName} · מימוש {fulfilled}/{total}
          </div>

          {templateNames.length > 0 && (
            <div className="text-xs text-neutral-500 mt-1">
              פריטים: {templateNames.join(', ')}
            </div>
          )}

          {request.note && (
            <div className="text-xs text-neutral-700 mt-1">📝 {request.note}</div>
          )}
        </div>

        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-danger-600 hover:bg-danger-50 rounded-md disabled:opacity-50"
          >
            <XCircle className="w-3 h-3" /> בטל
          </button>
        )}
      </div>
    </Card>
  );
}

function CreateRequestModal({
  templates,
  defaultTeamId,
  onClose,
  onCreate,
}: {
  templates: ReturnType<typeof useAmmunitionTemplates>['templates'];
  defaultTeamId?: string;
  onClose: () => void;
  onCreate: (payload: {
    scope: AmmunitionReportRequestScope;
    targetUserIds?: string[];
    targetTeamId?: string;
    templateIds?: string[];
    dueAtMs?: number;
    note?: string;
  }) => Promise<void>;
}) {
  const [choice, setChoice] = useState<ScopeChoice>({ kind: 'INDIVIDUAL', user: null });
  const [templateIds, setTemplateIds] = useState<Set<string>>(new Set());
  const [dueAt, setDueAt] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleTpl = (id: string) =>
    setTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (choice.kind === 'INDIVIDUAL' && !choice.user) {
      setError('יש לבחור משתמש');
      return;
    }
    if (choice.kind === 'TEAM' && !choice.teamId) {
      setError('יש להזין מזהה צוות');
      return;
    }
    setSubmitting(true);
    await onCreate({
      scope: choice.kind,
      ...(choice.kind === 'INDIVIDUAL' && choice.user ? { targetUserIds: [choice.user.uid] } : {}),
      ...(choice.kind === 'TEAM' ? { targetTeamId: choice.teamId } : {}),
      ...(templateIds.size > 0 ? { templateIds: Array.from(templateIds) } : {}),
      ...(dueAt ? { dueAtMs: new Date(dueAt).getTime() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">בקשת דיווח חדשה</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100"
            aria-label="close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">היקף</label>
            <div className="flex gap-2 flex-wrap">
              {(['INDIVIDUAL', 'TEAM', 'ALL'] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => {
                    if (k === 'INDIVIDUAL') setChoice({ kind: 'INDIVIDUAL', user: null });
                    else if (k === 'TEAM')
                      setChoice({ kind: 'TEAM', teamId: defaultTeamId || '' });
                    else setChoice({ kind: 'ALL' });
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm border ${
                    choice.kind === k
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {k === 'INDIVIDUAL' ? 'אישית' : k === 'TEAM' ? 'צוות' : 'כל המערכת'}
                </button>
              ))}
            </div>
            {choice.kind === 'INDIVIDUAL' && (
              <div className="mt-2">
                <UserSearchInput
                  value={choice.user}
                  onChange={(u) => setChoice({ kind: 'INDIVIDUAL', user: u })}
                  placeholder="חפש משתמש"
                />
              </div>
            )}
            {choice.kind === 'TEAM' && (
              <input
                type="text"
                value={choice.teamId}
                onChange={(e) => setChoice({ kind: 'TEAM', teamId: e.target.value.trim() })}
                placeholder="מזהה צוות"
                className="mt-2 w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              פריטים (אופציונלי)
            </label>
            <div className="border border-neutral-200 rounded-lg max-h-40 overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center p-3">אין תבניות</p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {templates.map((t) => (
                    <li key={t.id}>
                      <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={templateIds.has(t.id)}
                          onChange={() => toggleTpl(t.id)}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-900">{t.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              ללא בחירה — דיווח על כל פריט יסגור את הבקשה.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">תאריך יעד</label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">הערה</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              ביטול
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'שולח...' : 'שלח בקשה'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
