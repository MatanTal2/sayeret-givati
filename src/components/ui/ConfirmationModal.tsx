'use client';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  icon?: string;
  additionalInfo?: string;
  singleButton?: boolean; // New prop to show only confirm button
  useHomePageStyle?: boolean; // New prop to use home page styling
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'danger',
  icon,
  additionalInfo,
  singleButton = false,
  useHomePageStyle = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

    // Variant-based styling
  const variantStyles = {
    danger: {
      icon: icon || '⚠️',
      iconBg: useHomePageStyle ? 'bg-red-100' : 'bg-red-100 dark:bg-red-900/20',
      iconColor: useHomePageStyle ? 'text-red-600' : 'text-red-600 dark:text-red-400',
      confirmBg: useHomePageStyle ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-red-600 hover:bg-red-700',
      confirmFocus: 'focus:ring-red-500',
      infoBg: useHomePageStyle ? 'bg-red-50' : 'bg-red-50 dark:bg-red-900/20',
      infoBorder: useHomePageStyle ? 'border-red-200' : 'border-red-200 dark:border-red-800',
      infoText: useHomePageStyle ? 'text-red-800' : 'text-red-800 dark:text-red-300'
    },
    warning: {
      icon: icon || '⚠️',
      iconBg: useHomePageStyle ? 'bg-yellow-100' : 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: useHomePageStyle ? 'text-yellow-600' : 'text-yellow-600 dark:text-yellow-400',
      confirmBg: useHomePageStyle ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800' : 'bg-yellow-600 hover:bg-yellow-700',
      confirmFocus: 'focus:ring-yellow-500',
      infoBg: useHomePageStyle ? 'bg-yellow-50' : 'bg-yellow-50 dark:bg-yellow-900/20',
      infoBorder: useHomePageStyle ? 'border-yellow-200' : 'border-yellow-200 dark:border-yellow-800',
      infoText: useHomePageStyle ? 'text-yellow-800' : 'text-yellow-800 dark:text-yellow-300'
    },
    info: {
      icon: icon || 'ℹ️',
      iconBg: useHomePageStyle ? 'bg-purple-100' : 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: useHomePageStyle ? 'text-purple-600' : 'text-blue-600 dark:text-blue-400',
      confirmBg: useHomePageStyle ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' : 'bg-blue-600 hover:bg-blue-700',
      confirmFocus: useHomePageStyle ? 'focus:ring-purple-500' : 'focus:ring-blue-500',
      infoBg: useHomePageStyle ? 'bg-purple-50' : 'bg-blue-50 dark:bg-blue-900/20',
      infoBorder: useHomePageStyle ? 'border-purple-200' : 'border-blue-200 dark:border-blue-800',
      infoText: useHomePageStyle ? 'text-purple-800' : 'text-blue-800 dark:text-blue-300'
    },
    success: {
      icon: icon || '✅',
      iconBg: useHomePageStyle ? 'bg-green-100' : 'bg-green-100 dark:bg-green-900/20',
      iconColor: useHomePageStyle ? 'text-green-600' : 'text-green-600 dark:text-green-400',
      confirmBg: useHomePageStyle ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' : 'bg-green-600 hover:bg-green-700',
      confirmFocus: 'focus:ring-green-500',
      infoBg: useHomePageStyle ? 'bg-green-50' : 'bg-green-50 dark:bg-green-900/20',
      infoBorder: useHomePageStyle ? 'border-green-200' : 'border-green-200 dark:border-green-800',
      infoText: useHomePageStyle ? 'text-green-800' : 'text-green-800 dark:text-green-300'
    }
  };

  const styles = variantStyles[variant];

  // Handle Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      dir={useHomePageStyle ? "rtl" : "ltr"}
    >
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 ${useHomePageStyle ? 'bg-black bg-opacity-30 backdrop-blur-sm' : 'bg-black bg-opacity-50'} transition-opacity`}
        onClick={!isLoading ? onCancel : undefined}
      ></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative ${useHomePageStyle ? 'bg-white shadow-2xl' : 'bg-white dark:bg-gray-800 shadow-xl'} rounded-lg max-w-md w-full mx-auto ${useHomePageStyle ? 'modal-enter' : ''}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                <span className={`${styles.iconColor} text-xl`}>{styles.icon}</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {title}
                </h3>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {message}
            </p>
            {additionalInfo && (
              <div className={`${styles.infoBg} border ${styles.infoBorder} rounded-md p-3`}>
                <p className={`text-xs ${styles.infoText}`}>
                  {additionalInfo}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`${singleButton ? 'flex justify-center' : 'flex justify-end gap-3'} p-6 border-t border-gray-200 ${useHomePageStyle ? '' : 'dark:border-gray-700'}`}>
            {!singleButton && (
              <button
                onClick={onCancel}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium ${
                  useHomePageStyle 
                    ? 'text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 btn-press'
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600'
                } focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-6 py-3 font-semibold text-white 
                         ${styles.confirmBg} disabled:bg-gray-400 
                         border border-transparent ${useHomePageStyle ? 'rounded-lg btn-press hover:shadow-lg' : 'rounded-md'}
                         focus:ring-2 ${styles.confirmFocus} focus:ring-offset-2
                         disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  טוען...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
