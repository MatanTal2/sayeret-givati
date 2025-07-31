import { useState } from 'react';
import RegistrationHeader from './RegistrationHeader';
import RegistrationForm from './RegistrationForm';
import RegistrationFooter from './RegistrationFooter';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitch: () => void;
}

export default function RegistrationModal({ isOpen, onClose, onSwitch }: RegistrationModalProps) {
  const [personalNumber, setPersonalNumber] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset form state when closing
    setPersonalNumber('');
    onClose();
  };

  const handleSwitchToLogin = () => {
    // Reset form state when switching
    setPersonalNumber('');
    onSwitch();
  };

  return (
    <>
      {/* Backdrop - Blur Only */}
      <div 
        className="fixed inset-0 z-50 backdrop-enter backdrop-blur-sm bg-black/20"
        onClick={handleClose}
      />
      
      {/* Modal Container - Centered for all screen sizes */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm h-[600px] modal-enter pointer-events-auto 
                my-4 sm:my-8 flex flex-col">
          
          <RegistrationHeader 
            onBack={handleSwitchToLogin}
            onClose={handleClose}
          />
          
          <RegistrationForm 
            personalNumber={personalNumber}
            setPersonalNumber={setPersonalNumber}
            onSwitchToLogin={handleSwitchToLogin}
          />
          
          <RegistrationFooter />
        </div>
      </div>
    </>
  );
}