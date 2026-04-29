'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/userProfileService';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useSystemConfig } from '@/hooks/useSystemConfig';

/**
 * Mandatory onboarding modal. Surfaces whenever an authenticated user is missing
 * teamId — required for team-scoped equipment queries. Modal cannot be dismissed:
 * the user must save a value to proceed.
 *
 * Rendered by AppShell conditionally on `enhancedUser && !teamId`.
 */
export default function WelcomeModal() {
  useScrollLock(true);
  const { enhancedUser, refreshEnhancedUser } = useAuth();
  const { config, isLoading: teamsLoading, error: teamsError } = useSystemConfig();
  const [teamId, setTeamId] = useState(enhancedUser?.teamId ?? '');
  const teams = config?.teams ?? [];
  const teamsAvailable = teams.length > 0;
  const [errors, setErrors] = useState<{ teamId?: string; submit?: string }>({});
  const [saving, setSaving] = useState(false);

  if (!enhancedUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!teamId.trim()) nextErrors.teamId = TEXT_CONSTANTS.ONBOARDING.VALIDATION_TEAM_REQUIRED;
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await updateUserProfile(enhancedUser.uid, {
        teamId: teamId.trim(),
      });
      await refreshEnhancedUser();
      // refreshEnhancedUser populates teamId on enhancedUser; modal auto-unmounts
    } catch (err) {
      console.error('[WelcomeModal] save failed', err);
      setErrors({ submit: TEXT_CONSTANTS.ONBOARDING.SAVE_ERROR });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
        <Image
          src="/platon-d-logo.png"
          alt="Platon D"
          width={2944}
          height={1440}
          priority
          className="h-20 w-auto mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-neutral-900 text-center mb-2">
          {TEXT_CONSTANTS.ONBOARDING.WELCOME_TITLE}
          {enhancedUser.firstName ? ` ${enhancedUser.firstName}` : ''}
        </h1>
        <p className="text-sm text-neutral-600 text-center mb-6">
          {TEXT_CONSTANTS.ONBOARDING.WELCOME_SUBTITLE}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="welcome-team" className="block text-sm font-medium text-neutral-700 mb-1">
              {TEXT_CONSTANTS.ONBOARDING.TEAM_LABEL}
            </label>
            <select
              id="welcome-team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className={`input-base ${errors.teamId ? 'border-danger-500' : ''}`}
              disabled={teamsLoading || !teamsAvailable}
              autoFocus
            >
              <option value="">
                {teamsLoading
                  ? TEXT_CONSTANTS.ONBOARDING.TEAMS_LOADING
                  : TEXT_CONSTANTS.ONBOARDING.TEAM_SELECT_PLACEHOLDER}
              </option>
              {teams.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">{TEXT_CONSTANTS.ONBOARDING.TEAM_HELP}</p>
            {errors.teamId && <p className="text-danger-600 text-xs mt-1">{errors.teamId}</p>}
            {!teamsLoading && !teamsAvailable && !teamsError && (
              <p className="text-warning-700 text-xs mt-1">{TEXT_CONSTANTS.ONBOARDING.TEAMS_EMPTY}</p>
            )}
            {teamsError && (
              <p className="text-danger-600 text-xs mt-1">{TEXT_CONSTANTS.ONBOARDING.TEAMS_LOAD_ERROR}</p>
            )}
          </div>

          {errors.submit && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg px-3 py-2">
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || teamsLoading || !teamsAvailable || !teamId}
            className="btn-primary w-full"
          >
            {saving ? TEXT_CONSTANTS.ONBOARDING.SAVING : TEXT_CONSTANTS.ONBOARDING.SUBMIT}
          </button>
        </form>
      </div>
    </div>
  );
}
