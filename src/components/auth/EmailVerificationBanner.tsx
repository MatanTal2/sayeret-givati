'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT_CONSTANTS } from '@/constants/text';

export default function EmailVerificationBanner() {
  const { enhancedUser, resendVerificationEmail, refreshEmailVerified } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!enhancedUser || enhancedUser.emailVerified !== false) {
    return null;
  }

  const handleResend = async () => {
    if (isSending) return;
    setIsSending(true);
    setFeedback(null);
    const result = await resendVerificationEmail();
    setFeedback(
      result.success
        ? TEXT_CONSTANTS.AUTH.EMAIL_VERIFICATION_SENT
        : TEXT_CONSTANTS.AUTH.EMAIL_VERIFICATION_SEND_FAILED
    );
    setIsSending(false);
  };

  return (
    <div
      className="w-full bg-warning-100 border-b border-warning-300 text-warning-900 text-sm py-2 px-4 flex items-center justify-center gap-3"
      role="status"
      data-testid="email-verification-banner"
    >
      <span>{TEXT_CONSTANTS.AUTH.EMAIL_VERIFICATION_BANNER}</span>
      <button
        type="button"
        onClick={handleResend}
        disabled={isSending}
        className="underline font-medium hover:text-warning-700 disabled:text-neutral-400 disabled:no-underline"
      >
        {TEXT_CONSTANTS.AUTH.EMAIL_VERIFICATION_RESEND}
      </button>
      <button
        type="button"
        onClick={refreshEmailVerified}
        className="underline text-warning-700 hover:text-warning-900"
      >
        בדוק שוב
      </button>
      {feedback && <span className="text-xs">{feedback}</span>}
    </div>
  );
}
