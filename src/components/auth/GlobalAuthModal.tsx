'use client';

import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';

/**
 * GlobalAuthModal component that provides the auth modal globally across all pages
 * This ensures the login/register modal is available on any route
 */
export default function GlobalAuthModal() {
  const { showAuthModal, setShowAuthModal } = useAuth();

  return (
    <AuthModal 
      isOpen={showAuthModal} 
      onClose={() => setShowAuthModal(false)}
      onRegistrationSuccess={() => {
        // Close modal after successful registration
        // User stays on the current page they were trying to access
        setShowAuthModal(false);
        console.log('🎉 Registration successful! Welcome to Sayeret Givati!');
      }}
    />
  );
}