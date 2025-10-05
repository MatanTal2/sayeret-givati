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
      iconBg: useHomePageStyle ? 'bg-danger-100' : 'bg-danger-100 dark:bg-danger-900/20',
      iconColor: useHomePageStyle ? 'text-danger-600' : 'text-danger-600 dark:text-danger-400',
      confirmBg: useHomePageStyle ? 'bg-gradient-to-r from-danger-600 to-danger-700 hover:from-danger-700 hover:to-danger-800' : 'bg-danger-600 hover:bg-danger-700',
      confirmFocus: 'focus:ring-danger-500',
      infoBg: useHomePageStyle ? 'bg-danger-50' : 'bg-danger-50 dark:bg-danger-900/20',
      infoBorder: useHomePageStyle ? 'border-danger-200' : 'border-danger-200 dark:border-danger-800',
      infoText: useHomePageStyle ? 'text-danger-800' : 'text-danger-800 dark:text-danger-300'
    },
    warning: {
      icon: icon || '⚠️',
      iconBg: useHomePageStyle ? 'bg-warning-100' : 'bg-warning-100 dark:bg-warning-900/20',
      iconColor: useHomePageStyle ? 'text-warning-600' : 'text-warning-600 dark:text-warning-400',
      confirmBg: useHomePageStyle ? 'bg-gradient-to-r from-warning-600 to-warning-700 hover:from-warning-700 hover:to-warning-800' : 'bg-warning-600 hover:bg-warning-700',
      confirmFocus: 'focus:ring-warning-500',
      infoBg: useHomePageStyle ? 'bg-warning-50' : 'bg-warning-50 dark:bg-warning-900/20',
      infoBorder: useHomePageStyle ? 'border-warning-200' : 'border-warning-200 dark:border-warning-800',
      infoText: useHomePageStyle ? 'text-warning-800' : 'text-warning-800 dark:text-warning-300'
    },
    info: {
      icon: icon || 'ℹ️',
      iconBg: useHomePageStyle ? 'bg-primary-100' : 'bg-info-100 dark:bg-info-900/20',
      iconColor: useHomePageStyle ? 'text-primary-600' : 'text-info-600 dark:text-info-400',
      confirmBg: useHomePageStyle ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800' : 'bg-info-600 hover:bg-info-700',
      confirmFocus: useHomePageStyle ? 'focus:ring-primary-500' : 'focus:ring-info-500',
      infoBg: useHomePageStyle ? 'bg-primary-50' : 'bg-info-50 dark:bg-info-900/20',
      infoBorder: useHomePageStyle ? 'border-primary-200' : 'border-info-200 dark:border-info-800',
      infoText: useHomePageStyle ? 'text-primary-800' : 'text-info-800 dark:text-info-300'
    },
    success: {
      icon: icon || '✅',
      iconBg: useHomePageStyle ? 'bg-success-100' : 'bg-success-100 dark:bg-success-900/20',
      iconColor: useHomePageStyle ? 'text-success-600' : 'text-success-600 dark:text-success-400',
      confirmBg: useHomePageStyle ? 'bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800' : 'bg-success-600 hover:bg-success-700',
      confirmFocus: 'focus:ring-success-500',
      infoBg: useHomePageStyle ? 'bg-success-50' : 'bg-success-50 dark:bg-success-900/20',
      infoBorder: useHomePageStyle ? 'border-success-200' : 'border-success-200 dark:border-success-800',
      infoText: useHomePageStyle ? 'text-success-800' : 'text-success-800 dark:text-success-300'
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
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onCancel : undefined}
      ></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative ${useHomePageStyle ? 'bg-white shadow-2xl' : 'bg-white dark:bg-neutral-800 shadow-xl'} rounded-lg max-w-md w-full mx-auto ${useHomePageStyle ? 'modal-enter' : ''}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                <span className={`${styles.iconColor} text-xl`}>{styles.icon}</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                  {title}
                </h3>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
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
          <div className={`${singleButton ? 'flex justify-center' : 'flex justify-end gap-3'} p-6 border-t border-neutral-200 ${useHomePageStyle ? '' : 'dark:border-neutral-700'}`}>
            {!singleButton && (
              <button
                onClick={onCancel}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium ${
                  useHomePageStyle 
                    ? 'text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 btn-press'
                    : 'text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-600'
                } focus:ring-2 focus:ring-info-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-6 py-3 font-semibold text-white 
                         ${styles.confirmBg} disabled:bg-neutral-400 
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
