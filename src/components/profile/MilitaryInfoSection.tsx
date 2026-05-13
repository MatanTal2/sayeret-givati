'use client';

import { useEffect, useState } from 'react';
import { format, parse, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import type { EnhancedAuthUser } from '@/types/user';
import { UserRole } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';
import { updateUserProfile } from '@/lib/userProfileService';

interface Props {
  user: EnhancedAuthUser;
  onSaved: () => Promise<void> | void;
}

/**
 * Military Info card. Read-only display of rank/role/joinDate/status; team
 * and enlistment cycle are editable behind a section-level pencil toggle.
 * Save persists via `updateUserProfile` then asks the parent to refresh.
 */
export default function MilitaryInfoSection({ user, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState(user.teamId || '');
  const [enlistmentCycle, setEnlistmentCycle] = useState(user.enlistmentCycle || '');

  // Re-sync local edit state whenever the source-of-truth user object
  // changes (post-save refresh, or async hydration on first render).
  useEffect(() => {
    if (!editing) {
      setTeamId(user.teamId || '');
      setEnlistmentCycle(user.enlistmentCycle || '');
    }
  }, [user.teamId, user.enlistmentCycle, editing]);

  const formatJoinDate = (date: EnhancedAuthUser['joinDate']) => {
    if (!date) return TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE;
    try {
      const js = typeof date === 'object' && 'toDate' in date ? date.toDate() : new Date(date as unknown as string);
      return format(js, 'dd/MM/yyyy', { locale: he });
    } catch {
      return TEXT_CONSTANTS.PROFILE.INVALID_DATE;
    }
  };

  const formatEnlistmentCycle = (value: string | undefined) => {
    if (!value) return TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE;
    const parsed = parse(value, 'yyyy-MM', new Date());
    if (!isValid(parsed)) return value;
    return format(parsed, 'MMMM yyyy', { locale: he });
  };

  const roleLabel = (role: UserRole | undefined) => {
    if (role === UserRole.SOLDIER) return TEXT_CONSTANTS.PROFILE.SOLDIER;
    if (role === UserRole.COMMANDER) return TEXT_CONSTANTS.PROFILE.COMMANDER;
    if (role === UserRole.OFFICER) return TEXT_CONSTANTS.PROFILE.OFFICER;
    if (role === UserRole.EQUIPMENT_MANAGER) return TEXT_CONSTANTS.PROFILE.EQUIPMENT_MANAGER;
    return role ? String(role) : TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE;
  };

  const statusLabel = (status: EnhancedAuthUser['status']) => {
    if (status === 'active') return TEXT_CONSTANTS.PROFILE.ACTIVE;
    if (status === 'inactive') return TEXT_CONSTANTS.PROFILE.INACTIVE;
    if (status === 'transferred') return TEXT_CONSTANTS.PROFILE.TRANSFERRED;
    if (status === 'discharged') return TEXT_CONSTANTS.PROFILE.DISCHARGED;
    return status || TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE;
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile(user.uid, {
        teamId: teamId.trim(),
        enlistmentCycle: enlistmentCycle.trim(),
      });
      await onSaved();
      setEditing(false);
    } catch {
      setError(TEXT_CONSTANTS.PROFILE.SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setTeamId(user.teamId || '');
    setEnlistmentCycle(user.enlistmentCycle || '');
    setError(null);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-neutral-900 flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="truncate">{TEXT_CONSTANTS.PROFILE.MILITARY_INFO}</span>
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={TEXT_CONSTANTS.PROFILE.EDIT_SECTION_ARIA}
            className="btn-ghost text-sm flex items-center gap-1 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{TEXT_CONSTANTS.PROFILE.EDIT_SECTION}</span>
          </button>
        )}
      </div>

      <dl className="divide-y divide-neutral-100 -my-2">
        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm font-medium text-neutral-600">{TEXT_CONSTANTS.PROFILE.RANK}</dt>
          <dd className="text-neutral-900 sm:col-span-2">{user.rank || TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE}</dd>
        </div>

        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm font-medium text-neutral-600">{TEXT_CONSTANTS.PROFILE.ROLE}</dt>
          <dd className="text-neutral-900 sm:col-span-2">{roleLabel(user.role)}</dd>
        </div>

        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm font-medium text-neutral-600">{TEXT_CONSTANTS.PROFILE.JOIN_DATE}</dt>
          <dd className="text-neutral-900 sm:col-span-2">{formatJoinDate(user.joinDate)}</dd>
        </div>

        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm font-medium text-neutral-600">{TEXT_CONSTANTS.PROFILE.STATUS}</dt>
          <dd className="text-neutral-900 sm:col-span-2">{statusLabel(user.status)}</dd>
        </div>

        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-3 sm:items-center">
          <dt className="text-sm font-medium text-neutral-600">{TEXT_CONSTANTS.PROFILE.TEAM}</dt>
          <dd className="sm:col-span-2">
            {editing ? (
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder={TEXT_CONSTANTS.ONBOARDING.TEAM_PLACEHOLDER}
                className="input-base"
                disabled={saving}
              />
            ) : (
              <span className="text-neutral-900">{user.teamId || TEXT_CONSTANTS.PROFILE.NOT_AVAILABLE}</span>
            )}
          </dd>
        </div>

        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-3 sm:items-center">
          <dt className="text-sm font-medium text-neutral-600">{TEXT_CONSTANTS.PROFILE.ENLISTMENT_CYCLE}</dt>
          <dd className="sm:col-span-2">
            {editing ? (
              <input
                type="month"
                value={enlistmentCycle}
                onChange={(e) => setEnlistmentCycle(e.target.value)}
                placeholder={TEXT_CONSTANTS.PROFILE.ENLISTMENT_CYCLE_PLACEHOLDER}
                className="input-base"
                disabled={saving}
              />
            ) : (
              <span className="text-neutral-900">{formatEnlistmentCycle(user.enlistmentCycle)}</span>
            )}
          </dd>
        </div>
      </dl>

      {editing && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? TEXT_CONSTANTS.PROFILE.SAVING : TEXT_CONSTANTS.PROFILE.SAVE}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="btn-ghost"
          >
            {TEXT_CONSTANTS.PROFILE.CANCEL}
          </button>
          {error && <span className="text-sm text-danger-600">{error}</span>}
        </div>
      )}
    </div>
  );
}
