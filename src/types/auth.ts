/**
 * Authentication-related types
 */

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface LoginPromptProps {
  title?: string;
  description?: string;
  showRegistrationLink?: boolean;
}

export interface ComingSoonProps {
  title: string;
  description?: string;
  expectedDate?: string;
  showBackButton?: boolean;
}

export interface PageAccessProps {
  requiresAuth: boolean;
  isComingSoon: boolean;
  featureTitle: string;
  featureDescription?: string;
  expectedDate?: string;
}