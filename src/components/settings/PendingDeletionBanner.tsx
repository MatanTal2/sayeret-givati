'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cancelAccountDeletion } from '@/lib/accountDeletionClient';
import { useToast } from '@/components/ui/Toast';
import { TEXT_CONSTANTS } from '@/constants/text';
import { ACCOUNT_DELETION_RETENTION_DAYS } from '@/types/accountDeletion';
import type { Timestamp } from 'firebase/firestore';

/**
 * Banner rendered at the top of `AppShell` when the signed-in user has
 * a pending soft-delete (`enhancedUser.deletionRequestedAt` set). Shows
 * days remaining and a cancel-deletion button.
 *
 * Renders nothing when the user has no pending deletion.
 */
export default function PendingDeletionBanner() {
  const { enhancedUser, refreshEnhancedUser } = useAuth();
  const { showToast } = useToast();
  const [cancelling, setCancelling] = useState(false);

  const requestedAt = enhancedUser?.deletionRequestedAt;
  if (!requestedAt) return null;

  const daysLeft = computeDaysLeft(requestedAt);

  const onCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    const result = await cancelAccountDeletion();
    if (result.success) {
      showToast(TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_CANCEL_SUCCESS, 'success');
      await refreshEnhancedUser();
    } else if (result.code === 'no_pending_request') {
      showToast(TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_CANCEL_NO_PENDING, 'info');
      await refreshEnhancedUser();
    } else {
      showToast(TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_CANCEL_ERROR, 'danger');
    }
    setCancelling(false);
  };

  return (
    <div
      role="status"
      className="bg-danger-50 border-b border-danger-200 text-danger-900"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 text-danger-600 flex-shrink-0" aria-hidden="true" />
        <span className="font-semibold">
          {TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_PENDING_TITLE}
        </span>
        <span className="text-danger-700">
          {TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_PENDING_DAYS_LEFT(daysLeft)}
        </span>
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          className="ms-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white text-danger-700 border border-danger-300 hover:bg-danger-100 disabled:opacity-60 text-xs font-medium"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
          {cancelling
            ? TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_CANCELLING
            : TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_CANCEL_BUTTON}
        </button>
      </div>
    </div>
  );
}

/**
 * Days remaining until the 30-day retention window elapses. Floors to 0
 * so the message never goes negative when the cron is late.
 */
export function computeDaysLeft(requestedAt: Timestamp | Date | { toDate: () => Date }): number {
  const requestedMs = toDateMs(requestedAt);
  if (!requestedMs) return ACCOUNT_DELETION_RETENTION_DAYS;
  const elapsedMs = Date.now() - requestedMs;
  const remainingDays = Math.ceil(
    ACCOUNT_DELETION_RETENTION_DAYS - elapsedMs / (1000 * 60 * 60 * 24),
  );
  return Math.max(remainingDays, 0);
}

function toDateMs(t: Timestamp | Date | { toDate: () => Date }): number {
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'object' && t !== null && 'toDate' in t) {
    try {
      return (t as { toDate: () => Date }).toDate().getTime();
    } catch {
      return 0;
    }
  }
  return 0;
}
