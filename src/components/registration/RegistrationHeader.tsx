import { TEXT_CONSTANTS } from '@/constants/text';

interface RegistrationHeaderProps {
  onBack: () => void;
  onClose: () => void;
  disabled?: boolean;
}

export default function RegistrationHeader({ onBack, onClose, disabled = false }: RegistrationHeaderProps) {
  const lockedClass = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
  return (
    <div className="px-6 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        {/* Close Button - Right Side */}
        <button
          type="button"
          onClick={disabled ? undefined : onClose}
          disabled={disabled}
          className={`p-2 hover:bg-neutral-100 rounded-full btn-press focus-ring
                     text-neutral-400 hover:text-neutral-600 transition-all duration-200 ${lockedClass}`}
          aria-label={TEXT_CONSTANTS.ARIA_LABELS.CLOSE_MODAL}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title - Centered */}
        <h2 className="text-xl font-bold text-neutral-900">{TEXT_CONSTANTS.AUTH.REGISTER_TO_SYSTEM}</h2>

        {/* Back Arrow - Left Side */}
        <button
          type="button"
          onClick={disabled ? undefined : onBack}
          disabled={disabled}
          className={`p-2 hover:bg-neutral-100 rounded-full btn-press focus-ring
                     text-neutral-600 hover:text-neutral-800 transition-all duration-200 ${lockedClass}`}
          aria-label={TEXT_CONSTANTS.REGISTRATION_COMPONENTS.BACK_TO_LOGIN}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}