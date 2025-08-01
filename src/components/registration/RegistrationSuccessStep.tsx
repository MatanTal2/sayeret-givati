import { TEXT_CONSTANTS } from '@/constants/text';

interface RegistrationSuccessStepProps {
  onContinue?: () => void;
}

export default function RegistrationSuccessStep({ 
  onContinue 
}: RegistrationSuccessStepProps) {

  const handleContinue = () => {
    console.log('TODO: redirect to home page');
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="text-center px-6 pb-4">
        {/* Success Checkmark Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} 
                  d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        {/* Success Message */}
        <h3 className="text-2xl font-bold text-gray-900 mb-8" data-testid="success-message">
          {TEXT_CONSTANTS.AUTH.REGISTRATION_SUCCESS}
        </h3>
      </div>

      {/* Continue Button */}
      <div className="px-6 pb-5">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-3 px-4 font-semibold rounded-xl btn-press focus-ring
                   flex items-center justify-center gap-2
                   transition-all duration-200 bg-gradient-to-r from-green-600 to-green-700 
                   hover:from-green-700 hover:to-green-800 text-white hover:shadow-lg"
          data-testid="continue-button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          {TEXT_CONSTANTS.AUTH.CONTINUE_TO_SYSTEM}
        </button>
      </div>
    </>
  );
}