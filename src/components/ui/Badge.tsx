/**
 * Reusable Badge component for status indicators
 */
import React from 'react';
import { cn } from '@/lib/cn';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'filled' | 'outlined';
  color?: 'gray' | 'purple' | 'blue' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md';
  className?: string;
}

const colorVariants = {
  filled: {
    gray: 'bg-neutral-100 text-neutral-800',
    purple: 'bg-primary-100 text-primary-800',
    blue: 'bg-info-100 text-info-800',
    green: 'bg-success-100 text-success-800',
    yellow: 'bg-warning-100 text-warning-800',
    red: 'bg-danger-100 text-danger-800',
  },
  outlined: {
    gray: 'bg-transparent text-neutral-700 border border-neutral-700',
    purple: 'bg-transparent text-primary-700 border border-primary-700',
    blue: 'bg-transparent text-info-700 border border-info-700',
    green: 'bg-transparent text-success-700 border border-success-700',
    yellow: 'bg-transparent text-warning-700 border border-warning-700',
    red: 'bg-transparent text-danger-700 border border-danger-700',
  },
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2.5 py-1.5 text-sm',
};

export default function Badge({
  children,
  variant = 'filled',
  color = 'gray',
  size = 'sm',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        colorVariants[variant][color],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

