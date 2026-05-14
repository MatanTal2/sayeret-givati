/**
 * Users management tab — mobile-priority expandable rows (bug #21).
 *
 * Replaces the 6-column desktop-only table with a list of cards that
 * mirrors `EquipmentTable` on mobile: compact row shows status dot +
 * name (+ "ממתין" pending-registration badge), and clicking the row
 * reveals Email / Role / Rank / Team / Phone / Actions in an
 * expanded panel.
 *
 * The data source is `useUsersAndPersonnel`, which merges the `users`
 * collection with `authorized_personnel` so unregistered soldiers are
 * surfaced too (phone falls back to `authorized_personnel.phoneNumber`
 * when `users.phoneNumber` is missing).
 */
import React, { useMemo, useState } from 'react';
import { Users, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { useUsersAndPersonnel, type UserWithRegistration } from '@/hooks/useUsersAndPersonnel';
import { TEXT_CONSTANTS } from '@/constants/text';
import { Select } from '@/components/ui';
import { formatPhoneForDisplay } from '@/utils/validationUtils';
import { cn } from '@/lib/cn';

type RoleFilter = 'all' | 'admin' | 'manager' | 'user' | 'team_leader' | 'officer' | 'commander' | 'equipment_manager';
type StatusFilter = 'all' | 'active' | 'inactive' | 'transferred' | 'discharged';

const ROLE_FILTER_MATCHES: Record<Exclude<RoleFilter, 'all'>, string[]> = {
  admin: ['admin', 'מנהל מערכת', 'מנהל'],
  manager: ['manager', 'מנהל', 'מפקד', 'קצין'],
  user: ['soldier', 'user', 'חייל', 'משתמש'],
  team_leader: ['team_leader', 'מפקד צוות'],
  officer: ['officer', 'קצין'],
  commander: ['commander', 'מפקד'],
  equipment_manager: ['equipment_manager', 'מנהל ציוד'],
};

const STATUS_BADGE: Record<UserWithRegistration['status'], string> = {
  active: 'bg-success-100 text-success-800',
  inactive: 'bg-danger-100 text-danger-800',
  transferred: 'bg-warning-100 text-warning-800',
  discharged: 'bg-neutral-100 text-neutral-800',
};

const STATUS_DOT: Record<UserWithRegistration['status'], string> = {
  active: 'bg-success-500',
  inactive: 'bg-danger-500',
  transferred: 'bg-warning-500',
  discharged: 'bg-neutral-400',
};

const ROLE_BADGE_TONE = (role: string): string => {
  const r = role.toLowerCase();
  if (r.includes('admin') || role.includes('מנהל מערכת')) return 'bg-danger-100 text-danger-800';
  if (r.includes('manager') || role.includes('מנהל') || role.includes('קצין') || role.includes('מפקד')) return 'bg-info-100 text-info-800';
  return 'bg-neutral-100 text-neutral-800';
};

export default function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [expandedHash, setExpandedHash] = useState<string | null>(null);

  const { rows, loading, error, refresh } = useUsersAndPersonnel();

  const roleMatches = (row: UserWithRegistration): boolean => {
    if (selectedRole === 'all') return true;
    const needles = ROLE_FILTER_MATCHES[selectedRole];
    const haystack = `${row.role} ${row.roleDisplay}`.toLowerCase();
    return needles.some((n) => haystack.includes(n.toLowerCase()));
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rows.filter((u) => {
      const matchesSearch =
        term === '' ||
        u.fullName.toLowerCase().includes(term) ||
        (u.email?.toLowerCase().includes(term) ?? false) ||
        u.phoneNumber.includes(term);
      const matchesRole = roleMatches(u);
      const matchesStatus = selectedStatus === 'all' || u.status === selectedStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, searchTerm, selectedRole, selectedStatus]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((u) => u.status === 'active').length;
    const inactive = rows.filter((u) => u.status === 'inactive').length;
    const pending = rows.filter((u) => !u.registered).length;
    return { total, active, inactive, pending };
  }, [rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin me-3" />
        <span className="text-lg text-neutral-600">{TEXT_CONSTANTS.MANAGEMENT.USERS.LOADING_USERS}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-6 h-6 text-danger-600 me-3" />
          <div>
            <h3 className="text-lg font-medium text-danger-800">{TEXT_CONSTANTS.MANAGEMENT.USERS.ERROR_LOADING_TITLE}</h3>
            <p className="text-sm text-danger-600 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={() => refresh()}
          className="mt-4 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white font-medium rounded-lg transition-colors"
        >
          {TEXT_CONSTANTS.MANAGEMENT.USERS.TRY_AGAIN_BUTTON}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-start gap-2 flex-wrap">
        <button
          onClick={() => refresh()}
          className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 me-2 ${loading ? 'animate-spin' : ''}`} />
          {TEXT_CONSTANTS.MANAGEMENT.USERS.REFRESH_BUTTON}
        </button>
        <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm">
          {TEXT_CONSTANTS.MANAGEMENT.USERS.ADD_USER_BUTTON}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">חיפוש</label>
            <input
              type="text"
              placeholder={TEXT_CONSTANTS.MANAGEMENT.USERS.SEARCH_PLACEHOLDER}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">תפקיד</label>
            <Select
              value={selectedRole === 'all' ? null : selectedRole}
              onChange={(v) => setSelectedRole((v as RoleFilter) ?? 'all')}
              options={[
                { value: 'admin', label: TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_ADMIN },
                { value: 'manager', label: TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_MANAGER },
                { value: 'user', label: TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_USER },
                { value: 'team_leader', label: TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_TEAM_LEADER },
                { value: 'officer', label: TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_OFFICER },
                { value: 'commander', label: TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_COMMANDER },
                { value: 'equipment_manager', label: TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_EQUIPMENT_MANAGER },
              ]}
              placeholder={TEXT_CONSTANTS.MANAGEMENT.USERS.ALL_ROLES}
              clearable
              ariaLabel="תפקיד"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">סטטוס</label>
            <Select
              value={selectedStatus === 'all' ? null : selectedStatus}
              onChange={(v) => setSelectedStatus((v as StatusFilter) ?? 'all')}
              options={[
                { value: 'active', label: TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_ACTIVE },
                { value: 'inactive', label: TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_INACTIVE },
                { value: 'transferred', label: TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_TRANSFERRED },
                { value: 'discharged', label: TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_DISCHARGED },
              ]}
              placeholder={TEXT_CONSTANTS.MANAGEMENT.USERS.ALL_STATUSES}
              clearable
              ariaLabel="סטטוס"
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-neutral-600">
          {TEXT_CONSTANTS.MANAGEMENT.USERS.SHOWING_RESULTS(filtered.length, rows.length)}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-neutral-500">
            {rows.length === 0
              ? TEXT_CONSTANTS.MANAGEMENT.USERS.NO_USERS_SYSTEM
              : TEXT_CONSTANTS.MANAGEMENT.USERS.NO_USERS_FOUND}
          </div>
        ) : (
          <ul className="max-h-[28rem] overflow-y-auto divide-y divide-neutral-100">
            {filtered.map((row) => (
              <UserRow
                key={row.hash}
                row={row}
                expanded={expandedHash === row.hash}
                onToggle={() =>
                  setExpandedHash((cur) => (cur === row.hash ? null : row.hash))
                }
              />
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard tone="info" icon={<Users className="w-8 h-8 text-info-600" />} value={stats.total} label={TEXT_CONSTANTS.MANAGEMENT.USERS.TOTAL_USERS} />
        <StatCard tone="success" value={stats.active} label={TEXT_CONSTANTS.MANAGEMENT.USERS.ACTIVE_USERS} glyph="✓" />
        <StatCard tone="danger" value={stats.inactive} label={TEXT_CONSTANTS.MANAGEMENT.USERS.INACTIVE_USERS} glyph="×" />
        <StatCard tone="warning" value={stats.pending} label={TEXT_CONSTANTS.ADMIN.STATS_PENDING} glyph="⏳" />
      </div>
    </div>
  );
}

interface UserRowProps {
  row: UserWithRegistration;
  expanded: boolean;
  onToggle: () => void;
}

function UserRow({ row, expanded, onToggle }: UserRowProps) {
  const initials = getInitials(row.fullName);
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          'px-3 py-3 flex items-center gap-3 cursor-pointer transition-colors',
          expanded ? 'bg-primary-50' : 'hover:bg-neutral-50'
        )}
      >
        <span
          className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', STATUS_DOT[row.status])}
          title={statusLabel(row.status)}
          aria-label={statusLabel(row.status)}
        />
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary-600">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-neutral-900 truncate">{row.fullName}</span>
            {!row.registered && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-100 text-warning-800 flex-shrink-0">
                {TEXT_CONSTANTS.ADMIN.VIEW_PENDING_BADGE}
              </span>
            )}
          </div>
          <div className="text-xs text-neutral-500 truncate">{row.roleDisplay}</div>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform',
            expanded ? 'rotate-180' : ''
          )}
          aria-hidden
        />
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-neutral-50/40">
          <DetailField label={TEXT_CONSTANTS.MANAGEMENT.USERS.USER_COLUMN} value={row.email ?? '—'} />
          <DetailField label={TEXT_CONSTANTS.MANAGEMENT.USERS.RANK_COLUMN} value={row.rank} />
          <DetailField label={TEXT_CONSTANTS.MANAGEMENT.USERS.ROLE_COLUMN}>
            <span className={cn('px-2 py-1 text-xs font-medium rounded-full', ROLE_BADGE_TONE(row.roleDisplay))}>
              {row.roleDisplay}
            </span>
          </DetailField>
          <DetailField label={TEXT_CONSTANTS.MANAGEMENT.USERS.TEAM_COLUMN} value={row.team} />
          <DetailField label="טלפון" value={row.phoneNumber ? formatPhoneForDisplay(row.phoneNumber) : '—'} />
          <DetailField label={TEXT_CONSTANTS.MANAGEMENT.USERS.STATUS_COLUMN}>
            <span className={cn('px-2 py-1 text-xs font-medium rounded-full', STATUS_BADGE[row.status])}>
              {statusLabel(row.status)}
            </span>
          </DetailField>
          <div className="sm:col-span-2 flex items-center gap-2 pt-2 border-t border-neutral-100">
            <button className="text-info-600 hover:text-info-900 text-sm">
              {TEXT_CONSTANTS.MANAGEMENT.USERS.EDIT_ACTION}
            </button>
            <button className="text-danger-600 hover:text-danger-900 text-sm">
              {TEXT_CONSTANTS.MANAGEMENT.USERS.DELETE_ACTION}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function DetailField({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      {children ?? <div className="text-neutral-900">{value ?? '—'}</div>}
    </div>
  );
}

function StatCard({ tone, value, label, icon, glyph }: { tone: 'info' | 'success' | 'danger' | 'warning'; value: number; label: string; icon?: React.ReactNode; glyph?: string }) {
  const toneText: Record<typeof tone, string> = {
    info: 'text-info-600',
    success: 'text-success-600',
    danger: 'text-danger-600',
    warning: 'text-warning-600',
  };
  const toneBg: Record<typeof tone, string> = {
    info: 'bg-info-100',
    success: 'bg-success-100',
    danger: 'bg-danger-100',
    warning: 'bg-warning-100',
  };
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center">
        {icon ?? (
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', toneBg[tone])}>
            <span className={cn('font-bold', toneText[tone])}>{glyph}</span>
          </div>
        )}
        <div className="ms-4">
          <div className={cn('text-2xl font-bold', toneText[tone])}>{value}</div>
          <div className="text-sm text-neutral-600">{label}</div>
        </div>
      </div>
    </div>
  );
}

function statusLabel(s: UserWithRegistration['status']): string {
  const m = TEXT_CONSTANTS.MANAGEMENT.USERS;
  switch (s) {
    case 'active': return m.STATUS_ACTIVE;
    case 'inactive': return m.STATUS_INACTIVE;
    case 'transferred': return m.STATUS_TRANSFERRED;
    case 'discharged': return m.STATUS_DISCHARGED;
  }
}

function getInitials(fullName: string): string {
  const names = fullName.trim().split(/\s+/);
  if (names.length >= 2) return (names[0][0] || '') + (names[names.length - 1][0] || '');
  return names[0]?.[0] ?? '?';
}
