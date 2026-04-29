'use client';

import React, { useMemo, useState } from 'react';
import { KeyRound, Plus, ShieldAlert, X, Trash2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { GrantStatus, MAX_GRANT_DURATION_MS } from '@/types/permissionGrant';
import {
  usePermissionGrants,
  type PermissionGrantListItem,
} from '@/hooks/usePermissionGrants';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import UserSearchInput from '@/components/users/UserSearchInput';
import type { UserSearchResult } from '@/lib/userService';
import { Select } from '@/components/ui';

const ROLE_OPTIONS: { value: UserType; label: string }[] = [
  { value: UserType.TEAM_LEADER, label: 'מפקד צוות' },
  { value: UserType.MANAGER, label: 'מנהל' },
  { value: UserType.SYSTEM_MANAGER, label: 'מנהל מערכת' },
];

const ROLE_LABEL: Record<string, string> = {
  [UserType.ADMIN]: 'מנהל ראשי',
  [UserType.SYSTEM_MANAGER]: 'מנהל מערכת',
  [UserType.MANAGER]: 'מנהל',
  [UserType.TEAM_LEADER]: 'מפקד צוות',
  [UserType.USER]: 'משתמש',
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = Math.floor(MAX_GRANT_DURATION_MS / ONE_DAY_MS);

export default function PermissionGrantsTab() {
  const { enhancedUser } = useAuth();
  const { config } = useSystemConfig();
  const { grants, isLoading, error, issue, revoke } = usePermissionGrants();
  const [showIssue, setShowIssue] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(
    null
  );

  const isIssuer =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER;

  const showToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRevoke = async (grant: PermissionGrantListItem) => {
    if (!confirm(`לבטל הענקה ל-${grant.userDisplayName || grant.userId}?`)) return;
    setBusy(grant.id);
    const result = await revoke(grant.id);
    setBusy(null);
    showToast(result.ok ? 'success' : 'error', result.ok ? 'הענקה בוטלה' : result.error || 'ביטול נכשל');
  };

  return (
    <div className="space-y-6">
      {!isIssuer && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-warning-50 border border-warning-200 text-warning-800 text-sm">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <span>צפייה בלבד — רק מנהל או מנהל מערכת יכולים להעניק או לבטל תפקידים.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary-600" />
            <h4 className="text-lg font-medium text-neutral-900">הענקות תפקיד פעילות והיסטוריה</h4>
          </div>
          {isIssuer && (
            <button
              type="button"
              onClick={() => setShowIssue(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              הענקה חדשה
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="h-24 rounded-lg bg-neutral-100 animate-pulse" />
        ) : grants.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-6">אין הענקות פעילות.</p>
        ) : (
          <GrantsTable
            grants={grants}
            isIssuer={!!isIssuer}
            busyId={busy}
            onRevoke={handleRevoke}
          />
        )}
      </div>

      {showIssue && isIssuer && (
        <IssueGrantModal
          teams={config?.teams ?? []}
          onClose={() => setShowIssue(false)}
          onSubmit={async (payload) => {
            const result = await issue(payload);
            if (result.ok) {
              showToast('success', 'הענקה נוצרה');
              setShowIssue(false);
            } else {
              showToast('error', result.error || 'יצירת הענקה נכשלה');
            }
            return result.ok;
          }}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${
            toast.kind === 'success'
              ? 'bg-success-100 text-success-800 border border-success-200'
              : 'bg-danger-100 text-danger-800 border border-danger-200'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

interface GrantsTableProps {
  grants: PermissionGrantListItem[];
  isIssuer: boolean;
  busyId: string | null;
  onRevoke: (grant: PermissionGrantListItem) => void;
}

function GrantsTable({ grants, isIssuer, busyId, onRevoke }: GrantsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-neutral-700">
          <tr>
            <Th>משתמש</Th>
            <Th>תפקיד</Th>
            <Th>היקף</Th>
            <Th>פג תוקף</Th>
            <Th>סטטוס</Th>
            <Th>סיבה</Th>
            <Th>הוענק על ידי</Th>
            {isIssuer && <Th>פעולות</Th>}
          </tr>
        </thead>
        <tbody>
          {grants.map((g) => (
            <GrantRow
              key={g.id}
              grant={g}
              isIssuer={isIssuer}
              isBusy={busyId === g.id}
              onRevoke={onRevoke}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-start px-3 py-2 font-medium border-b border-neutral-200">{children}</th>;
}

function GrantRow({
  grant,
  isIssuer,
  isBusy,
  onRevoke,
}: {
  grant: PermissionGrantListItem;
  isIssuer: boolean;
  isBusy: boolean;
  onRevoke: (g: PermissionGrantListItem) => void;
}) {
  const status = effectiveStatus(grant);
  const expiresLabel = new Date(grant.expiresAtMs).toLocaleString('he-IL');
  const canRevoke = isIssuer && grant.status === GrantStatus.ACTIVE && !grant.isExpired;

  return (
    <tr className="border-b border-neutral-100 last:border-0">
      <Td>{grant.userDisplayName || grant.userId}</Td>
      <Td>{ROLE_LABEL[grant.grantedRole] ?? grant.grantedRole}</Td>
      <Td>{grant.scope === 'all' ? 'כלל הצוותים' : `צוות ${grant.scopeTeamId ?? ''}`}</Td>
      <Td>
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          {expiresLabel}
        </span>
      </Td>
      <Td>
        <StatusBadge status={status} />
      </Td>
      <Td className="max-w-[200px] truncate" title={grant.reason}>
        {grant.reason}
      </Td>
      <Td>{grant.issuedByDisplayName || grant.issuedBy}</Td>
      {isIssuer && (
        <Td>
          {canRevoke && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onRevoke(grant)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-danger-700 hover:bg-danger-50 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              ביטול
            </button>
          )}
        </Td>
      )}
    </tr>
  );
}

function Td({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <td className={`px-3 py-2 align-top ${className ?? ''}`} title={title}>
      {children}
    </td>
  );
}

type EffectiveStatus = 'active' | 'expired' | 'revoked';

function effectiveStatus(grant: PermissionGrantListItem): EffectiveStatus {
  if (grant.status === GrantStatus.REVOKED) return 'revoked';
  if (grant.isExpired) return 'expired';
  return 'active';
}

function StatusBadge({ status }: { status: EffectiveStatus }) {
  const map: Record<EffectiveStatus, { text: string; cls: string }> = {
    active: { text: 'פעיל', cls: 'bg-success-100 text-success-800 border-success-200' },
    expired: { text: 'פג תוקף', cls: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
    revoked: { text: 'בוטל', cls: 'bg-danger-100 text-danger-800 border-danger-200' },
  };
  const { text, cls } = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full border ${cls}`}>
      {text}
    </span>
  );
}

interface IssueGrantModalProps {
  teams: string[];
  onClose: () => void;
  onSubmit: (payload: {
    userId: string;
    userDisplayName?: string;
    grantedRole: UserType;
    scope: 'all' | 'team';
    scopeTeamId?: string;
    durationMs: number;
    reason: string;
  }) => Promise<boolean>;
}

function IssueGrantModal({ teams, onClose, onSubmit }: IssueGrantModalProps) {
  const [user, setUser] = useState<UserSearchResult | null>(null);
  const [role, setRole] = useState<UserType | null>(UserType.TEAM_LEADER);
  const [scope, setScope] = useState<'all' | 'team'>('team');
  const [team, setTeam] = useState<string | null>(null);
  const [days, setDays] = useState<number>(7);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamOptions = useMemo(
    () => teams.map((t) => ({ value: t, label: t })),
    [teams]
  );

  const canSubmit =
    !!user &&
    !!role &&
    !!reason.trim() &&
    days > 0 &&
    days <= MAX_DAYS &&
    (scope === 'all' || !!team);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user || !role) return;
    setSubmitting(true);
    setError(null);
    const ok = await onSubmit({
      userId: user.uid,
      ...(user.displayName ? { userDisplayName: user.displayName } : {}),
      grantedRole: role,
      scope,
      ...(scope === 'team' && team ? { scopeTeamId: team } : {}),
      durationMs: days * ONE_DAY_MS,
      reason: reason.trim(),
    });
    setSubmitting(false);
    if (!ok) setError('יצירת הענקה נכשלה. בדוק שאין הענקה כפולה ושהזנה תקינה.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">הענקת תפקיד זמני</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100"
            aria-label="close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">משתמש</label>
            <UserSearchInput value={user} onChange={setUser} placeholder="חפש משתמש לפי שם או אימייל" />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">תפקיד</label>
            <Select
              value={role}
              onChange={(v) => setRole(v as UserType | null)}
              options={ROLE_OPTIONS}
              ariaLabel="תפקיד"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">היקף</label>
            <div className="flex gap-2">
              <ScopeButton active={scope === 'team'} onClick={() => setScope('team')}>
                צוות יחיד
              </ScopeButton>
              <ScopeButton active={scope === 'all'} onClick={() => setScope('all')}>
                כלל הצוותים
              </ScopeButton>
            </div>
          </div>

          {scope === 'team' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">צוות</label>
              {teamOptions.length === 0 ? (
                <input
                  type="text"
                  value={team ?? ''}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="הזן מזהה צוות"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <Select
                  value={team}
                  onChange={(v) => setTeam(v ?? null)}
                  options={teamOptions}
                  placeholder="בחר צוות"
                  ariaLabel="צוות"
                />
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              תוקף (ימים, מקסימום {MAX_DAYS})
            </label>
            <input
              type="number"
              min={1}
              max={MAX_DAYS}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-32 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">סיבה</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="לדוגמה: מילוי מקום של מפקד צוות 7 בשבוע 5"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && (
            <div className="p-2 rounded-md bg-danger-50 border border-danger-200 text-danger-800 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 text-white font-medium transition-colors"
            >
              {submitting ? 'שומר...' : 'הענק'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
        active
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
      }`}
    >
      {children}
    </button>
  );
}
