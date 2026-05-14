'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { Eye, EyeOff, X, ArrowRight, ShieldAlert, CheckCircle2, LogOut } from 'lucide-react';
import {
  reauthEmailPassword,
  verifyNewPhone,
  applyVerifiedPhoneCredential,
  mapFirebaseAuthError,
  initRecaptcha,
  resetRecaptcha,
  RequiresRecentLoginError,
} from '@/lib/firebasePhoneAuth';
import {
  initiatePhoneChange,
  confirmPhoneChange,
  cancelPhoneChange,
} from '@/lib/phoneChangeClient';
import { revokeOtherSessions } from '@/lib/sessionsClient';
import { TEXT_CONSTANTS } from '@/constants/text';

const RECAPTCHA_CONTAINER_ID = 'change-phone-recaptcha';
const E164_PATTERN = /^\+\d{8,15}$/;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'preflight' | 'reauth' | 'enterNumber' | 'enterOtp' | 'success';

type RevokeState = 'idle' | 'submitting' | 'done' | 'error';

export default function ChangePhoneModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('preflight');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [pendingNonce, setPendingNonce] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokeState, setRevokeState] = useState<RevokeState>('idle');
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const hasPendingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setStep('preflight');
      setPassword('');
      setShowPassword(false);
      setNewPhone('');
      setOtpCode('');
      setVerificationId(null);
      setPendingNonce(null);
      setSubmitting(false);
      setError(null);
      setRevokeState('idle');
      setRevokeError(null);
      hasPendingRef.current = false;
      // Council recommendation: reset reCAPTCHA on mount. The module-level
      // cachedVerifier survives across React mounts; if registration ran
      // earlier in the same session, its consumed token would cause the
      // next verifyPhoneNumber to hang.
      resetRecaptcha();
    }
  }, [open]);

  const closeAndCleanup = () => {
    if (hasPendingRef.current) {
      void cancelPhoneChange();
      hasPendingRef.current = false;
    }
    // On the success step the phone change already committed; closing via
    // X / backdrop should still fire the parent's success callback so the
    // toast surfaces. Pre-success closures stay cancel-only.
    if (step === 'success') {
      onSuccess();
    }
    onClose();
  };

  const onReauthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !password) return;
    setError(null);
    setSubmitting(true);
    try {
      await reauthEmailPassword(password);
      setStep('enterNumber');
    } catch (err) {
      if (err instanceof RequiresRecentLoginError) {
        setError(TEXT_CONSTANTS.AUTH.REQUIRES_RECENT_LOGIN);
      } else {
        setError(mapFirebaseAuthError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !newPhone) return;
    if (!E164_PATTERN.test(newPhone)) {
      setError(TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_INVALID_E164);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      resetRecaptcha();
      const verifier = initRecaptcha(RECAPTCHA_CONTAINER_ID);
      const vid = await verifyNewPhone(newPhone, verifier);
      setVerificationId(vid);
      setStep('enterOtp');
    } catch (err) {
      resetRecaptcha();
      setError(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !otpCode || !verificationId) return;
    setError(null);
    setSubmitting(true);
    try {
      // Step 1: reserve a pending slot. Server returns nonce + may 429 / same-number.
      const initiate = await initiatePhoneChange(newPhone);
      if (!initiate.success || !initiate.nonce) {
        if (initiate.code === 'rate_limited') {
          setError(TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_RATE_LIMITED);
        } else if (initiate.code === 'same_number') {
          setError(TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_SAME_NUMBER);
        } else {
          setError(TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_GENERIC_ERROR);
        }
        setSubmitting(false);
        return;
      }
      setPendingNonce(initiate.nonce);
      hasPendingRef.current = true;

      // Step 2: apply verified credential to Firebase Auth + refresh idToken.
      try {
        await applyVerifiedPhoneCredential(verificationId, otpCode);
      } catch (err) {
        // Updating Auth failed (wrong code, already-in-use, etc.). Cancel the
        // reservation so the rate limit doesn't block the retry.
        await cancelPhoneChange();
        hasPendingRef.current = false;
        setError(mapFirebaseAuthError(err));
        setSubmitting(false);
        return;
      }

      // Step 3: confirm to the server — it reads phone_number from the fresh
      // idToken claim and commits the Firestore mirror.
      const confirm = await confirmPhoneChange(newPhone, initiate.nonce);
      if (!confirm.success) {
        if (confirm.code === 'mirror_failed') {
          setError(TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_MIRROR_FAILED);
        } else {
          setError(TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_GENERIC_ERROR);
        }
        setSubmitting(false);
        return;
      }

      hasPendingRef.current = false;
      setStep('success');
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Success-state revoke. Server already bumped `users.sessionEpoch` to
  // `auth_time` during phone-change confirm, so other devices were already
  // fenced. Hitting `/api/users/sessions/revoke` here bumps the epoch a
  // second time — idempotent in effect, but gives the user an explicit
  // affordance + visual ack instead of trusting the silent server-side fence.
  const onRevokeOthersNow = async () => {
    if (revokeState === 'submitting' || revokeState === 'done') return;
    setRevokeError(null);
    setRevokeState('submitting');
    const result = await revokeOtherSessions();
    if (result.success) {
      setRevokeState('done');
    } else {
      setRevokeState('error');
      setRevokeError(result.error || TEXT_CONSTANTS.SETTINGS.REVOKE_SESSIONS_ERROR);
    }
  };

  const finishSuccess = () => {
    onSuccess();
    onClose();
  };

  const goBackToNumberStep = () => {
    if (submitting) return;
    setStep('enterNumber');
    setOtpCode('');
    setVerificationId(null);
    resetRecaptcha();
  };

  return (
    <Dialog open={open} onClose={submitting ? () => {} : closeAndCleanup} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-start justify-between mb-4 gap-2">
            <DialogTitle className="text-xl font-bold text-neutral-900">
              {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_TITLE}
            </DialogTitle>
            <button
              type="button"
              onClick={closeAndCleanup}
              disabled={submitting}
              aria-label={TEXT_CONSTANTS.SETTINGS.CANCEL}
              className="btn-ghost p-1"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm text-neutral-600 mb-5">
            {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_DESCRIPTION}
          </p>

          {step === 'preflight' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-700">
                {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_STEP_PREFLIGHT_TITLE}
              </h3>
              <div className="flex items-start gap-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-warning-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm text-warning-900">
                  <p className="mb-2 font-medium">
                    {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_PREFLIGHT_INTRO}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-warning-800">
                    <li>{TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_PREFLIGHT_BULLET_SMS}</li>
                    <li>{TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_PREFLIGHT_BULLET_REAUTH}</li>
                    <li>{TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_PREFLIGHT_BULLET_SESSIONS}</li>
                    <li>{TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_PREFLIGHT_BULLET_RATE_LIMIT}</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAndCleanup}
                  className="btn-ghost"
                >
                  {TEXT_CONSTANTS.SETTINGS.CANCEL}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('reauth')}
                  className="btn-primary"
                >
                  {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_PREFLIGHT_START}
                </button>
              </div>
            </div>
          )}

          {step === 'reauth' && (
            <form onSubmit={onReauthSubmit} className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-700">
                {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_STEP_REAUTH_TITLE}
              </h3>
              <div className="relative">
                <input
                  id="reauth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={TEXT_CONSTANTS.SETTINGS.CURRENT_PASSWORD}
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
              {error && <ErrorBox message={error} />}
              <FooterButtons
                onCancel={closeAndCleanup}
                submitting={submitting}
                submitDisabled={!password}
                submitLabel={TEXT_CONSTANTS.BUTTONS.SUBMIT}
              />
            </form>
          )}

          {step === 'enterNumber' && (
            <form onSubmit={onSendOtp} className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-700">
                {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_STEP_NEW_NUMBER_TITLE}
              </h3>
              <label htmlFor="new-phone" className="block text-xs text-neutral-600">
                {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_NEW_NUMBER_LABEL}
              </label>
              <input
                id="new-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value.trim())}
                placeholder={TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_NEW_NUMBER_PLACEHOLDER}
                disabled={submitting}
                className="input-base text-start"
                dir="ltr"
              />
              {error && <ErrorBox message={error} />}
              <FooterButtons
                onCancel={closeAndCleanup}
                submitting={submitting}
                submitDisabled={!newPhone}
                submitLabel={TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_SUBMIT_NEW_NUMBER}
              />
            </form>
          )}

          {step === 'enterOtp' && (
            <form onSubmit={onConfirmOtp} className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-700">
                {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_STEP_OTP_TITLE}
              </h3>
              <p className="text-xs text-neutral-500" dir="ltr">{newPhone}</p>
              <label htmlFor="phone-otp" className="block text-xs text-neutral-600">
                {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_OTP_LABEL}
              </label>
              <input
                id="phone-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                disabled={submitting}
                className="input-base text-center tracking-widest"
                dir="ltr"
              />
              <button
                type="button"
                onClick={goBackToNumberStep}
                disabled={submitting}
                className="text-xs text-primary-600 hover:underline disabled:opacity-50"
              >
                <ArrowRight className="w-3 h-3 inline-block me-1" aria-hidden="true" />
                {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_BACK_TO_STEP_NUMBER}
              </button>
              {error && <ErrorBox message={error} />}
              <FooterButtons
                onCancel={closeAndCleanup}
                submitting={submitting}
                submitDisabled={otpCode.length < 6}
                submitLabel={TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_SUBMIT_OTP}
                submittingLabel={TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_SUBMITTING}
              />
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-success-50 border border-success-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm text-success-900">
                  <p className="font-medium">
                    {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_SUCCESS_TITLE}
                  </p>
                  <p className="mt-1 text-success-800">
                    {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_SUCCESS_BODY}
                  </p>
                </div>
              </div>

              {revokeState === 'done' ? (
                <div
                  className="flex items-center gap-2 text-sm text-success-700 bg-success-50 border border-success-200 rounded-lg px-3 py-2"
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_SIGN_OUT_NOW_DONE}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onRevokeOthersNow}
                  disabled={revokeState === 'submitting'}
                  className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  {revokeState === 'submitting'
                    ? TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_SIGN_OUT_NOW_SUBMITTING
                    : TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_SIGN_OUT_NOW_BUTTON}
                </button>
              )}
              {revokeState === 'error' && revokeError && (
                <ErrorBox message={revokeError} />
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={finishSuccess}
                  className="btn-primary"
                >
                  {TEXT_CONSTANTS.SETTINGS.CHANGE_PHONE_SUCCESS_DONE}
                </button>
              </div>
            </div>
          )}

          <div id={RECAPTCHA_CONTAINER_ID} />
          {pendingNonce && <span className="hidden" aria-hidden="true" data-testid="pending-nonce" />}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2"
      role="alert"
    >
      {message}
    </div>
  );
}

function FooterButtons({
  onCancel,
  submitting,
  submitDisabled,
  submitLabel,
  submittingLabel,
}: {
  onCancel: () => void;
  submitting: boolean;
  submitDisabled: boolean;
  submitLabel: string;
  submittingLabel?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="btn-ghost"
      >
        {TEXT_CONSTANTS.SETTINGS.CANCEL}
      </button>
      <button type="submit" disabled={submitting || submitDisabled} className="btn-primary">
        {submitting && submittingLabel ? submittingLabel : submitLabel}
      </button>
    </div>
  );
}
