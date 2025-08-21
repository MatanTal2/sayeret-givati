'use client';

import React from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';

interface EquipmentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface EquipmentErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class EquipmentErrorBoundary extends React.Component<
  EquipmentErrorBoundaryProps,
  EquipmentErrorBoundaryState
> {
  constructor(props: EquipmentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): EquipmentErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Equipment Error Boundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  return (
    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
      <div className="text-6xl mb-6">
        ⚠️
      </div>
      
      <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-3">
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.ERROR_LOADING}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.UNEXPECTED_ERROR}
      </p>
      
      {error && (
        <details className="mb-6 text-left max-w-lg mx-auto">
          <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TECHNICAL_DETAILS}
          </summary>
          <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto">
            {error.message}
            {error.stack && (
              <pre className="mt-2 whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
          </div>
        </details>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={resetError}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg 
                     hover:bg-blue-700 transition-colors duration-200
                     focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRY_AGAIN}
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg 
                     hover:bg-gray-700 transition-colors duration-200
                     focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          {TEXT_CONSTANTS.FEATURES.EQUIPMENT.REFRESH_PAGE}
        </button>
      </div>
      
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONTACT_ADMIN}
      </div>
    </div>
  );
}

export default EquipmentErrorBoundary;
