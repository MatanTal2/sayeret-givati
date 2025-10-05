/**
 * App logo component with home navigation
 */
import React from 'react';

export default function AppLogo() {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleGoHome}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary-50 transition-colors"
      aria-label="חזור לדף הבית"
    >
      <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">SG</span>
      </div>
      <span className="hidden sm:block text-lg font-bold text-primary-600">
        סיירת גבעתי
      </span>
    </button>
  );
}

