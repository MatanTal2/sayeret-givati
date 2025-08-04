import { useState } from 'react';
import RegistrationHeader from './RegistrationHeader';
import RegistrationForm from './RegistrationForm';
import RegistrationFooter from './RegistrationFooter';
import RegistrationStepDots, { RegistrationStep } from './RegistrationStepDots';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitch: () => void;
  onRegistrationSuccess?: () => void;
}

export default function RegistrationModal({ isOpen, onClose, onSwitch, onRegistrationSuccess }: RegistrationModalProps) {
  const [personalNumber, setPersonalNumber] = useState('');
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('personal-number');

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset form state when closing
    setPersonalNumber('');
    setCurrentStep('personal-number');
    onClose();
  };

  const handleSwitchToLogin = () => {
    // Reset form state when switching
    setPersonalNumber('');
    setCurrentStep('personal-number');
    onSwitch();
  };

  const handleStepChange = (step: RegistrationStep) => {
    setCurrentStep(step);
  };

  // Dynamic back navigation based on current step
  const handleBackNavigation = () => {
    switch (currentStep) {
      case 'personal-number':
        handleSwitchToLogin(); // Go to login
        break;
      case 'otp':
        setCurrentStep('personal-number'); // Go to ID verification
        break;
      case 'personal':
        setCurrentStep('otp'); // Go to OTP
        break;
      case 'account':
        setCurrentStep('personal'); // Go to personal details
        break;
      // success step has no back button behavior
      default:
        handleSwitchToLogin();
    }
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
            onBack={handleBackNavigation}
            onClose={handleClose}
          />
          
          {/* Progress Stepper */}
          <div className="px-6 pt-2">
            <RegistrationStepDots currentStep={currentStep} />
          </div>
          
          <RegistrationForm 
            personalNumber={personalNumber}
            setPersonalNumber={setPersonalNumber}
            onSwitchToLogin={handleSwitchToLogin}
            onStepChange={handleStepChange}
            currentStep={currentStep}
            onRegistrationSuccess={onRegistrationSuccess}
          />
          
          <RegistrationFooter showRegistrationNote={currentStep === 'personal-number'} />
        </div>
      </div>
    </>
  );
}