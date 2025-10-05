import { TEXT_CONSTANTS } from '@/constants/text';

interface RegistrationFooterProps {
  showRegistrationNote?: boolean;
}

export default function RegistrationFooter({ showRegistrationNote = false }: RegistrationFooterProps) {
  return (
    <div className="px-6 pb-4 text-center border-t border-neutral-100 pt-4">
      {showRegistrationNote && (
        <p className="text-xs text-neutral-500 mb-2">
          {TEXT_CONSTANTS.AUTH.REGISTRATION_NOTE}
        </p>
      )}
      <p className="text-xs text-neutral-500">
        {TEXT_CONSTANTS.COMPANY_NAME}
      </p>
    </div>
  );
}