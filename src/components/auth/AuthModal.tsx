import AuthModalController from './AuthModalController';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistrationSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onRegistrationSuccess }: AuthModalProps) {
  return (
    <AuthModalController 
      isOpen={isOpen}
      onClose={onClose}
      initialModal="login"
      onRegistrationSuccess={onRegistrationSuccess}
    />
  );
}