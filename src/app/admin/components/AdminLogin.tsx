'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { TEXT_CONSTANTS } from '@/constants/text';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, message } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
    if (!message || message.type === 'success') {
      onLoginSuccess();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Admin Login
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            System Administrator Access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500
                         disabled:opacity-50"
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.EMAIL_PLACEHOLDER}
              autoComplete="username"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         focus:ring-2 focus:ring-info-500 focus:border-info-500
                         disabled:opacity-50"
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.ADMIN_PASSWORD_PLACEHOLDER}
              autoComplete="current-password"
              required
              disabled={isLoading}
            />
          </div>

          {message && (
            <div className={`rounded-md p-4 ${
              message.type === 'success' 
                ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800' 
                : 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800'
            }`}>
              <div className="flex">
                <div className={message.type === 'success' ? 'text-success-400' : 'text-danger-400'}>
                  {message.type === 'success' ? '✅' : '⚠️'}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${
                    message.type === 'success' 
                      ? 'text-success-700 dark:text-success-400' 
                      : 'text-danger-700 dark:text-danger-400'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-info-600 hover:bg-info-700 disabled:bg-neutral-400 
                       text-white font-medium py-2 px-4 rounded-md
                       focus:ring-2 focus:ring-info-500 focus:ring-offset-2
                       disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Authenticating...
              </div>
            ) : (
              'Login to Admin Panel'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            🔒 Secure system administrator access only
          </p>
        </div>
      </div>
    </div>
  );
} 