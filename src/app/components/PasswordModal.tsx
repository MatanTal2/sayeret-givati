import { TEXT_CONSTANTS } from '@/constants/text';

interface PasswordModalProps {
  show: boolean;
  password: string;
  showPassword: boolean;
  passwordError: string;
  isUpdating: boolean;
  onPasswordChange: (password: string) => void;
  onTogglePasswordVisibility: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function PasswordModal({
  show,
  password,
  showPassword,
  passwordError,
  isUpdating,
  onPasswordChange,
  onTogglePasswordVisibility,
  onSubmit,
  onCancel
}: PasswordModalProps) {
  if (!show) return null;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          הזן סיסמת מנהל
        </h3>
        <div className="mb-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={TEXT_CONSTANTS.STATUS_PAGE.PASSWORD_PLACEHOLDER}
              className={`w-full border-2 rounded-md px-3 py-2 pr-10 text-neutral-800 focus:outline-none focus:ring-2 ${
                passwordError 
                  ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' 
                  : 'border-neutral-400 focus:ring-primary-500 focus:border-primary-500'
              }`}
              onKeyPress={handleKeyPress}
            />
            <button
              type="button"
              onClick={onTogglePasswordVisibility}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:outline-none"
            >
              {showPassword ? (
                <span className="text-lg">🙈</span>
              ) : (
                <span className="text-lg">😑</span>
              )}
            </button>
          </div>
          {passwordError && (
            <p className="mt-1 text-sm text-danger-600">{passwordError}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={isUpdating}
            className="px-4 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 disabled:bg-success-400 transition-colors flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                מעדכן...
              </>
            ) : (
              'עדכן'
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={isUpdating}
            className="px-4 py-2 bg-neutral-500 text-white rounded-md hover:bg-neutral-600 disabled:bg-neutral-400 transition-colors"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
} 