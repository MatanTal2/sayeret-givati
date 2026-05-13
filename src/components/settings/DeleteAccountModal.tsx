'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { Eye, EyeOff, X, AlertTriangle } from 'lucide-react';
import {
  reauthEmailPassword,
  mapFirebaseAuthError,
  RequiresRecentLoginError,
} from '@/lib/firebasePhoneAuth';
import { requestAccountDeletion } from '@/lib/accountDeletionClient';
import { TEXT_CONSTANTS } from '@/constants/text';
import type { OutstandingAssets } from '@/types/accountDeletion';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteAccountModal({ open, onClose, onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outstanding, setOutstanding] = useState<OutstandingAssets | null>(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      setShowPassword(false);
      setReason('');
      setSubmitting(false);
      setError(null);
      setOutstanding(null);
    }
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !password) return;
    setError(null);
    setOutstanding(null);
    setSubmitting(true);
    try {
      await reauthEmailPassword(password);
    } catch (err) {
      if (err instanceof RequiresRecentLoginError) {
        setError(TEXT_CONSTANTS.AUTH.REQUIRES_RECENT_LOGIN);
      } else {
        setError(mapFirebaseAuthError(err));
      }
      setSubmitting(false);
      return;
    }

    const result = await requestAccountDeletion(reason);
    if (result.success) {
      onSuccess();
      onClose();
      return;
    }
    if (result.code === 'has_outstanding_assets' && result.outstanding) {
      setOutstanding(result.outstanding);
      setError(TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_HAS_ASSETS);
    } else if (result.code === 'already_requested') {
      setError(TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_ALREADY_REQUESTED);
    } else {
      setError(TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_GENERIC_ERROR);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onClose={submitting ? () => {} : onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-start justify-between mb-4 gap-2">
            <DialogTitle className="text-xl font-bold text-danger-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              {TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_TITLE}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label={TEXT_CONSTANTS.SETTINGS.CANCEL}
              className="btn-ghost p-1"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2 mb-4">
            {TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_WARNING_LONG}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="delete-password" className="block text-sm font-medium text-neutral-700 mb-1">
                {TEXT_CONSTANTS.SETTINGS.CURRENT_PASSWORD}
              </label>
              <div className="relative">
                <input
                  id="delete-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={submitting}
                  className="input-base pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting}
                  aria-label={
                    showPassword
                      ? TEXT_CONSTANTS.SETTINGS.HIDE_PASSWORD
                      : TEXT_CONSTANTS.SETTINGS.SHOW_PASSWORD
                  }
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 p-1"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                    : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="delete-reason" className="block text-sm font-medium text-neutral-700 mb-1">
                {TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_REASON_LABEL}
              </label>
              <textarea
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                disabled={submitting}
                placeholder={TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_REASON_PLACEHOLDER}
                className="input-base"
              />
            </div>

            {outstanding && (
              <div className="text-xs text-danger-700 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2 space-y-1">
                <div className="font-semibold">{TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_OUTSTANDING_HEADING}</div>
                {outstanding.equipmentCount > 0 && (
                  <div>{TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_OUTSTANDING_EQUIPMENT}: {outstanding.equipmentCount}</div>
                )}
                {outstanding.ammunitionUserHoldings > 0 && (
                  <div>{TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_OUTSTANDING_AMMUNITION}: {outstanding.ammunitionUserHoldings}</div>
                )}
                {outstanding.pendingTransferRequests > 0 && (
                  <div>{TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_OUTSTANDING_TRANSFERS}: {outstanding.pendingTransferRequests}</div>
                )}
              </div>
            )}

            {error && (
              <div className="text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2" role="alert">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn-ghost"
              >
                {TEXT_CONSTANTS.SETTINGS.CANCEL}
              </button>
              <button
                type="submit"
                disabled={submitting || !password}
                className="btn-danger"
              >
                {submitting
                  ? TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_SUBMITTING
                  : TEXT_CONSTANTS.SETTINGS.DELETE_ACCOUNT_SUBMIT}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
