export { default as AuthModal } from './AuthModal';

// Export props interfaces for reusability  
export type { AuthModalProps } from './AuthModal';

// Re-export auth context for convenience
export { useAuth } from '@/contexts/AuthContext';
export type { AuthContextType, AuthCredentials, AuthUser } from '@/contexts/AuthContext'; 