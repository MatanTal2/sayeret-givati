import React, { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import RegistrationModal from '../registration/RegistrationModal';

type ModalType = 'login' | 'registration' | null;

interface AuthModalControllerProps {
  isOpen: boolean;
  onClose: () => void;
  initialModal?: 'login' | 'registration';
}

export default function AuthModalController({ 
  isOpen, 
  onClose, 
  initialModal = 'login' 
}: AuthModalControllerProps) {
  const [currentModal, setCurrentModal] = useState<ModalType>(isOpen ? initialModal : null);

  // Reset modal state when isOpen changes
  useEffect(() => {
    setCurrentModal(isOpen ? initialModal : null);
  }, [isOpen, initialModal]);

  const handleClose = () => {
    setCurrentModal(null);
    onClose();
  };

  const handleSwitchToLogin = () => {
    setCurrentModal('login');
  };

  const handleSwitchToRegistration = () => {
    setCurrentModal('registration');
  };

  // Only render one modal at a time
  if (!isOpen || !currentModal) return null;

  return (
    <>
      <LoginModal 
        isOpen={currentModal === 'login'}
        onClose={handleClose}
        onSwitch={handleSwitchToRegistration}
      />
      
      <RegistrationModal 
        isOpen={currentModal === 'registration'}
        onClose={handleClose}
        onSwitch={handleSwitchToLogin}
      />
    </>
  );
}