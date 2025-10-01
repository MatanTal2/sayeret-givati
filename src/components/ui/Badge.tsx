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
    gray: 'bg-gray-100 text-gray-800',
    purple: 'bg-purple-100 text-purple-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
  },
  outlined: {
    gray: 'bg-transparent text-gray-700 border border-gray-700',
    purple: 'bg-transparent text-purple-700 border border-purple-700',
    blue: 'bg-transparent text-blue-700 border border-blue-700',
    green: 'bg-transparent text-green-700 border border-green-700',
    yellow: 'bg-transparent text-yellow-700 border border-yellow-700',
    red: 'bg-transparent text-red-700 border border-red-700',
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

