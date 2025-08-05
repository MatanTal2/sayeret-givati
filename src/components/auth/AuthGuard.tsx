'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPrompt from './LoginPrompt';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * AuthGuard component that protects content behind authentication
 * Shows LoginPrompt for unauthenticated users, content for authenticated users
 */
export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return fallback || <LoginPrompt />;
  }

  // Show protected content for authenticated users
  return <>{children}</>;
}