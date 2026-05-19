'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Save, Package } from 'lucide-react';
import { Switch } from '@headlessui/react';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import AmmoRecipientsSection from '@/components/management/tabs/system-config/AmmoRecipientsSection';
import { TEXT_CONSTANTS } from '@/constants/text';
import { cn } from '@/lib/cn';

export default function SystemConfigTab() {
  const { enhancedUser } = useAuth();
  const { config, isLoading, error, save } = useSystemConfig();

  const canEdit =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER;

  const [roundOpen, setRoundOpen] = useState<boolean>(false);
  const [savingRound, setSavingRound] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const persistedRoundOpen = !!config?.roundOpen;
  const recipientIds = config?.ammoNotificationRecipientUserIds ?? [];

  useEffect(() => {
    if (!config) return;
    setRoundOpen(persistedRoundOpen);
  }, [config, persistedRoundOpen]);

  const roundDirty = roundOpen !== persistedRoundOpen;

  const handleSaveRound = async () => {
    if (!canEdit) return;
    setSavingRound(true);
    setToast(null);
    const ok = await save({ roundOpen });
    setSavingRound(false);
    setToast(
      ok
        ? { kind: 'success', message: 'הגדרות נשמרו' }
        : { kind: 'error', message: 'שמירת ההגדרות נכשלה' }
    );
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveRecipients = async (next: string[]) => {
    const ok = await save({ ammoNotificationRecipientUserIds: next });
    if (!ok) {
      throw new Error('save_failed');
    }
  };

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-warning-50 border border-warning-200 text-warning-800 text-sm">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <span>צפייה בלבד — רק מנהל מערכת או מנהל יחידה יכול לעדכן הגדרות.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="h-32 rounded-lg bg-neutral-100 animate-pulse" />
      ) : (
        <AmmoRecipientsSection
          value={recipientIds}
          onSave={handleSaveRecipients}
          disabled={!canEdit}
        />
      )}

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary-600" />
          <h4 className="text-lg font-medium text-neutral-900">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.SYSTEM_CONFIG.ROUND_OPEN_LABEL}
          </h4>
        </div>
        <p className="text-sm text-neutral-600 mb-4">
          {TEXT_CONSTANTS.FEATURES.EQUIPMENT.SYSTEM_CONFIG.ROUND_OPEN_HELP}
        </p>
        <div className={cn('flex items-center gap-3', !canEdit && 'pointer-events-none opacity-60')}>
          <Switch
            checked={roundOpen}
            onChange={setRoundOpen}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              roundOpen ? 'bg-success-500' : 'bg-neutral-300'
            )}
          >
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
                roundOpen ? 'start-6' : 'start-1'
              )}
            />
          </Switch>
          <span className="text-sm text-neutral-700">
            {roundOpen ? 'פעיל' : 'סגור'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!canEdit || !roundDirty || savingRound}
          onClick={handleSaveRound}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {savingRound ? 'שומר...' : 'שמור הגדרות'}
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
