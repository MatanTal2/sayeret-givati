'use client';

import { useState } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { sendPasswordReset, mapFirebaseAuthError } from '@/lib/firebasePhoneAuth';

type Status = 'idle' | 'submitting' | 'sent' | 'verify-first' | 'not-found' | 'error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'submitting') return;

    setStatus('submitting');
    setErrorMessage(null);

    try {
      const checkResponse = await fetch('/api/auth/check-email-verified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const checkData = await checkResponse.json();

      if (checkData.status === 'unverified') {
        setStatus('verify-first');
        return;
      }

      if (checkData.status === 'not-found') {
        // Don't reveal account existence — show generic success
        setStatus('sent');
        return;
      }

      if (checkData.status !== 'verified') {
        setStatus('error');
        setErrorMessage(TEXT_CONSTANTS.AUTH.OTP_INTERNAL_ERROR);
        return;
      }

      await sendPasswordReset(email.trim());
      setStatus('sent');
    } catch (error) {
      setStatus('error');
      setErrorMessage(mapFirebaseAuthError(error));
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="card-base w-full max-w-md p-6 space-y-4">
        <h1 className="text-xl font-bold text-neutral-900 text-center">
          {TEXT_CONSTANTS.AUTH.FORGOT_PASSWORD_TITLE}
        </h1>
        <p className="text-sm text-neutral-600 text-center">
          {TEXT_CONSTANTS.AUTH.FORGOT_PASSWORD_SUBTITLE}
        </p>

        {status === 'sent' && (
          <p
            className="text-success-700 bg-success-50 border border-success-200 rounded-md p-3 text-sm text-center"
            data-testid="forgot-password-sent"
          >
            {TEXT_CONSTANTS.AUTH.FORGOT_PASSWORD_EMAIL_SENT}
          </p>
        )}

        {status === 'verify-first' && (
          <p
            className="text-warning-800 bg-warning-50 border border-warning-200 rounded-md p-3 text-sm text-center"
            data-testid="forgot-password-verify-first"
          >
            {TEXT_CONSTANTS.AUTH.FORGOT_PASSWORD_VERIFY_FIRST}
          </p>
        )}

        {status === 'error' && errorMessage && (
          <p
            className="text-danger-700 bg-danger-50 border border-danger-200 rounded-md p-3 text-sm text-center"
            data-testid="forgot-password-error"
          >
            {errorMessage}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={TEXT_CONSTANTS.AUTH.EMAIL_PLACEHOLDER_REGISTRATION}
            required
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500 outline-none"
            data-testid="forgot-password-email"
          />
          <button
            type="submit"
            disabled={status === 'submitting' || !email.trim()}
            className="btn-primary w-full py-3"
            data-testid="forgot-password-submit"
          >
            {status === 'submitting'
              ? TEXT_CONSTANTS.BUTTONS.LOADING
              : TEXT_CONSTANTS.AUTH.FORGOT_PASSWORD_SUBMIT}
          </button>
        </form>
      </div>
    </main>
  );
}
