'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { Eye, EyeOff, X } from 'lucide-react';
import { changePassword, mapFirebaseAuthError } from '@/lib/firebasePhoneAuth';
import { TEXT_CONSTANTS } from '@/constants/text';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MIN_PASSWORD_LENGTH = 6;

export default function ChangePasswordModal({ open, onClose, onSuccess }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset all form state whenever the modal re-opens. Avoids leaking the
  // previous attempt's inputs back into a fresh open.
  useEffect(() => {
    if (open) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setShowCurrent(false);
      setShowNext(false);
      setShowConfirm(false);
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const validate = (): string | null => {
    if (!current || !next || !confirm) return null; // submit will be disabled
    if (next.length < MIN_PASSWORD_LENGTH) return TEXT_CONSTANTS.SETTINGS.PASSWORD_TOO_SHORT;
    if (next !== confirm) return TEXT_CONSTANTS.SETTINGS.PASSWORDS_MISMATCH;
    if (next === current) return TEXT_CONSTANTS.SETTINGS.PASSWORD_UNCHANGED;
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await changePassword(current, next);
      onSuccess();
      onClose();
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const formInvalid = !current || !next || !confirm;

  return (
    <Dialog open={open} onClose={submitting ? () => {} : onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-start justify-between mb-4 gap-2">
            <DialogTitle className="text-xl font-bold text-neutral-900">
              {TEXT_CONSTANTS.SETTINGS.CHANGE_PASSWORD_TITLE}
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
          <p className="text-sm text-neutral-600 mb-5">
            {TEXT_CONSTANTS.SETTINGS.CHANGE_PASSWORD_DESCRIPTION}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <PasswordField
              id="current-password"
              label={TEXT_CONSTANTS.SETTINGS.CURRENT_PASSWORD}
              value={current}
              onChange={setCurrent}
              show={showCurrent}
              toggleShow={() => setShowCurrent((v) => !v)}
              autoComplete="current-password"
              disabled={submitting}
            />
            <PasswordField
              id="new-password"
              label={TEXT_CONSTANTS.SETTINGS.NEW_PASSWORD}
              value={next}
              onChange={setNext}
              show={showNext}
              toggleShow={() => setShowNext((v) => !v)}
              autoComplete="new-password"
              disabled={submitting}
            />
            <PasswordField
              id="confirm-new-password"
              label={TEXT_CONSTANTS.SETTINGS.CONFIRM_NEW_PASSWORD}
              value={confirm}
              onChange={setConfirm}
              show={showConfirm}
              toggleShow={() => setShowConfirm((v) => !v)}
              autoComplete="new-password"
              disabled={submitting}
            />

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
                disabled={submitting || formInvalid}
                className="btn-primary"
              >
                {submitting
                  ? TEXT_CONSTANTS.SETTINGS.CHANGE_PASSWORD_SUBMITTING
                  : TEXT_CONSTANTS.SETTINGS.CHANGE_PASSWORD_SUBMIT}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggleShow: () => void;
  autoComplete: string;
  disabled: boolean;
}

function PasswordField({ id, label, value, onChange, show, toggleShow, autoComplete, disabled }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          className="input-base pe-10"
        />
        <button
          type="button"
          onClick={toggleShow}
          disabled={disabled}
          aria-label={show ? TEXT_CONSTANTS.SETTINGS.HIDE_PASSWORD : TEXT_CONSTANTS.SETTINGS.SHOW_PASSWORD}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 p-1"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
