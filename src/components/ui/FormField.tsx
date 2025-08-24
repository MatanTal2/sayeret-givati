/**
 * Reusable FormField component for consistent form styling
 */
import React from 'react';
import { cn } from '@/lib/cn';

export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export default function FormField({
  label,
  children,
  error,
  required = false,
  className,
  id,
}: FormFieldProps) {
  const fieldId = id || `field-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      
      <div className="relative">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            const existingClassName = (child.props as { className?: string }).className;
            // Type assertion to work around React.cloneElement typing limitations
            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
              id: fieldId,
              className: cn(
                'w-full px-3 py-2 border border-gray-300 rounded-lg',
                'focus:ring-2 focus:ring-purple-500 focus:border-purple-500',
                'disabled:bg-gray-50 disabled:text-gray-500',
                error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
                existingClassName
              ),
              'aria-invalid': error ? 'true' : undefined,
              'aria-describedby': error ? `${fieldId}-error` : undefined,
            } as Record<string, unknown>);
          }
          return child;
        })}
      </div>
      
      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

