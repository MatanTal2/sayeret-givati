import { TEXT_CONSTANTS } from '@/constants/text';

export default function RegistrationFooter() {
  return (
    <div className="px-6 pb-4 text-center border-t border-gray-100 pt-4">
      <p className="text-xs text-gray-500 mb-2">
        {TEXT_CONSTANTS.AUTH.REGISTRATION_NOTE}
      </p>
      <p className="text-xs text-gray-500">
        {TEXT_CONSTANTS.COMPANY_NAME}
      </p>
    </div>
  );
}