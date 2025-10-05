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
    <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-danger-200 dark:border-danger-800">
      <div className="text-6xl mb-6">
        ⚠️
      </div>
      
      <h3 className="text-xl font-semibold text-danger-600 dark:text-danger-400 mb-3">
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.ERROR_LOADING}
      </h3>
      
      <p className="text-neutral-600 dark:text-neutral-400 mb-4 max-w-md mx-auto">
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.UNEXPECTED_ERROR}
      </p>
      
      {error && (
        <details className="mb-6 text-left max-w-lg mx-auto">
          <summary className="text-sm text-neutral-500 dark:text-neutral-400 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TECHNICAL_DETAILS}
          </summary>
          <div className="mt-2 p-3 bg-neutral-100 dark:bg-neutral-700 rounded text-xs font-mono text-neutral-800 dark:text-neutral-200 overflow-auto">
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
          className="px-6 py-3 bg-info-600 text-white font-medium rounded-lg 
                     hover:bg-info-700 transition-colors duration-200
                     focus:ring-2 focus:ring-info-500 focus:ring-offset-2"
        >
          {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRY_AGAIN}
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-neutral-600 text-white font-medium rounded-lg 
                     hover:bg-neutral-700 transition-colors duration-200
                     focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
        >
          {TEXT_CONSTANTS.FEATURES.EQUIPMENT.REFRESH_PAGE}
        </button>
      </div>
      
      <div className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONTACT_ADMIN}
      </div>
    </div>
  );
}

export default EquipmentErrorBoundary;
