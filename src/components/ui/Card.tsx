/**
 * Reusable Card component with consistent styling
 */
import React from 'react';
import { cn } from '@/lib/cn';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  background?: 'white' | 'gray' | 'purple';
}

const paddingVariants = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const shadowVariants = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

const backgroundVariants = {
  white: 'bg-white',
  gray: 'bg-gray-50',
  purple: 'bg-purple-50',
};

export default function Card({
  children,
  className,
  padding = 'md',
  shadow = 'sm',
  border = true,
  background = 'white',
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg',
        backgroundVariants[background],
        paddingVariants[padding],
        shadowVariants[shadow],
        border && 'border border-gray-200',
        className
      )}
    >
      {children}
    </div>
  );
}

