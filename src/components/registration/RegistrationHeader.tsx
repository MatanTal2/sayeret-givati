import { TEXT_CONSTANTS } from '@/constants/text';

interface RegistrationHeaderProps {
  onBack: () => void;
  onClose: () => void;
}

export default function RegistrationHeader({ onBack, onClose }: RegistrationHeaderProps) {
  return (
    <div className="px-6 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        {/* Close Button - Right Side */}
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full btn-press focus-ring
                     text-gray-400 hover:text-gray-600 transition-all duration-200"
          aria-label={TEXT_CONSTANTS.ARIA_LABELS.CLOSE_MODAL}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Title - Centered */}
        <h2 className="text-xl font-bold text-gray-900">{TEXT_CONSTANTS.AUTH.REGISTER_TO_SYSTEM}</h2>
        
        {/* Back Arrow - Left Side */}
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full btn-press focus-ring
                     text-gray-600 hover:text-gray-800 transition-all duration-200"
          aria-label="חזרה להתחברות"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}