'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { LogOutIcon, X } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useToast } from '@/components/ui/Toast';
import { revokeOtherSessions } from '@/lib/sessionsClient';

/**
 * Settings row + confirm modal that lets the user end every OTHER session
 * on their account. The current device stays signed in because
 * `users.sessionEpoch` is bumped to this device's `auth_time` — other
 * devices fail the fence in `getActorFromRequest` on their next API hit.
 *
 * Renders inside the Account Security section of the Settings page.
 */
export default function RevokeSessionsRow() {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    const result = await revokeOtherSessions();
    setSubmitting(false);
    if (result.success) {
      showToast(TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS_SUCCESS, 'success');
      setConfirmOpen(false);
    } else {
      showToast(
        result.error || TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS_ERROR,
        'danger',
      );
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
        <div className="flex items-center gap-4">
          <LogOutIcon className="w-5 h-5 text-neutral-400" />
          <div>
            <h3 className="font-medium text-neutral-900">
              {TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS}
            </h3>
            <p className="text-sm text-neutral-500">
              {TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS_DESCRIPTION}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="btn-primary text-sm"
        >
          {TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS}
        </button>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => (!submitting ? setConfirmOpen(false) : undefined)}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <DialogTitle className="text-lg font-bold text-neutral-900">
                {TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS_CONFIRM_TITLE}
              </DialogTitle>
              <button
                type="button"
                onClick={() => (!submitting ? setConfirmOpen(false) : undefined)}
                disabled={submitting}
                className="text-neutral-400 hover:text-neutral-600 disabled:opacity-60"
                aria-label={TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS_CANCEL}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-neutral-700 mb-6">
              {TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS_CONFIRM_BODY}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="btn-ghost text-sm"
              >
                {TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS_CANCEL}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={submitting}
                className="btn-primary text-sm"
              >
                {submitting
                  ? TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS_SUBMITTING
                  : TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS_CONFIRM_SUBMIT}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
