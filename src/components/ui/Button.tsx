/**
 * Reusable Button component with consistent styling and variants
 */
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
  secondary: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700 focus:ring-neutral-500',
  danger: 'bg-danger-600 hover:bg-danger-700 text-white focus:ring-danger-500',
  ghost: 'text-primary-600 hover:text-primary-700 hover:bg-primary-50 focus:ring-primary-500',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      
      {Icon && iconPosition === 'left' && !isLoading && (
        <Icon className="w-4 h-4" />
      )}
      
      {children}
      
      {Icon && iconPosition === 'right' && !isLoading && (
        <Icon className="w-4 h-4" />
      )}
    </button>
  );
}

