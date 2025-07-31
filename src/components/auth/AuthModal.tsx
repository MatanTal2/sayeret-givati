import AuthModalController from './AuthModalController';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <AuthModalController 
      isOpen={isOpen}
      onClose={onClose}
      initialModal="login"
    />
  );
}