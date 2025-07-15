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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          הזן סיסמת מנהל
        </h3>
        <div className="mb-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="סיסמה"
              className={`w-full border-2 rounded-md px-3 py-2 pr-10 text-gray-800 focus:outline-none focus:ring-2 ${
                passwordError 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-400 focus:ring-purple-500 focus:border-purple-500'
              }`}
              onKeyPress={handleKeyPress}
            />
            <button
              type="button"
              onClick={onTogglePasswordVisibility}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? (
                <span className="text-lg">🙈</span>
              ) : (
                <span className="text-lg">😑</span>
              )}
            </button>
          </div>
          {passwordError && (
            <p className="mt-1 text-sm text-red-600">{passwordError}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={isUpdating}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center gap-2"
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
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 transition-colors"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
} 