'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, ShieldAlert, Save } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import UserSearchInput from '@/components/users/UserSearchInput';
import type { UserSearchResult } from '@/lib/userService';
import { getUserProfile } from '@/lib/userService';

export default function SystemConfigTab() {
  const { enhancedUser } = useAuth();
  const { config, isLoading, error, save } = useSystemConfig();

  const isAdmin =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER;

  const [recipient, setRecipient] = useState<UserSearchResult | null>(null);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const persistedRecipientId = config?.ammoNotificationRecipientUserId || '';

  useEffect(() => {
    if (!config) return;
    if (hydratedFor === persistedRecipientId) return;
    if (!persistedRecipientId) {
      setRecipient(null);
      setHydratedFor('');
      return;
    }
    let alive = true;
    (async () => {
      const profile = await getUserProfile(persistedRecipientId);
      if (!alive) return;
      if (profile) {
        setRecipient({
          uid: profile.uid,
          displayName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
          email: profile.email || '',
          firstName: profile.firstName,
          lastName: profile.lastName,
          rank: profile.rank,
          status: profile.status,
        });
      } else {
        setRecipient(null);
      }
      setHydratedFor(persistedRecipientId);
    })();
    return () => {
      alive = false;
    };
  }, [config, persistedRecipientId, hydratedFor]);

  const dirty = useMemo(() => {
    return (recipient?.uid || '') !== persistedRecipientId;
  }, [recipient, persistedRecipientId]);

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    setToast(null);
    const ok = await save({ ammoNotificationRecipientUserId: recipient?.uid || '' });
    setSaving(false);
    setToast(
      ok
        ? { kind: 'success', message: 'הגדרות נשמרו' }
        : { kind: 'error', message: 'שמירת ההגדרות נכשלה' }
    );
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-warning-50 border border-warning-200 text-warning-800 text-sm">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <span>צפייה בלבד — רק מנהל מערכת יכול לעדכן הגדרות.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary-600" />
          <h4 className="text-lg font-medium text-neutral-900">התראות תחמושת</h4>
        </div>
        <p className="text-sm text-neutral-600 mb-4">
          המנהל האחראי לתחמושת יקבל התראה על כל דיווח חדש בנוסף למפקד הצוות של המדווח.
        </p>

        <label className="block text-sm font-medium text-neutral-700 mb-2">
          המנהל האחראי
        </label>
        {isLoading ? (
          <div className="h-10 rounded-lg bg-neutral-100 animate-pulse" />
        ) : (
          <div className={isAdmin ? '' : 'pointer-events-none opacity-60'}>
            <UserSearchInput
              value={recipient}
              onChange={setRecipient}
              placeholder="חפש משתמש לפי שם או אימייל"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!isAdmin || !dirty || saving}
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'שומר...' : 'שמור הגדרות'}
        </button>
        {toast && (
          <span
            className={`text-sm ${
              toast.kind === 'success' ? 'text-success-700' : 'text-danger-700'
            }`}
          >
            {toast.message}
          </span>
        )}
      </div>
    </div>
  );
}
