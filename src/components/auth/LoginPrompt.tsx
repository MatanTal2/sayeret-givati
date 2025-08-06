'use client';

import { useAuth } from '@/contexts/AuthContext';
import { TEXT_CONSTANTS } from '@/constants/text';

/**
 * LoginPrompt component that displays a user-friendly message
 * prompting unauthenticated users to log in
 */
export default function LoginPrompt() {
  const { setShowAuthModal } = useAuth();

  const handleLoginClick = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full">
        {/* Login Prompt Card */}
        <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
          {/* Lock Icon */}
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-primary mb-4">
            {TEXT_CONSTANTS.STATUS.REQUIRES_AUTH}
          </h2>

          {/* Description */}
          <p className="text-secondary mb-8 leading-relaxed">
            כדי לגשת לתכונה זו, עליך להתחבר למערכת עם הפרטים שלך.
            <br />
            ההתחברות מאבטחת ומוגנת לחלוטין.
          </p>

          {/* Login Button */}
          <button
            onClick={handleLoginClick}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            {TEXT_CONSTANTS.STATUS.LOGIN_TO_ACCESS}
          </button>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              עדיין אין לך חשבון? צור קשר עם המנהל לקבלת גישה למערכת.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}