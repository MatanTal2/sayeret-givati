/**
 * Daily Status Badge Component
 * Displays a badge indicating if equipment requires daily status checks
 */
import React from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';

interface DailyStatusBadgeProps {
  requiresDailyStatusCheck: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined';
}

export default function DailyStatusBadge({ 
  requiresDailyStatusCheck,
  size = 'md',
  variant = 'filled'
}: DailyStatusBadgeProps) {
  // Don't render anything if daily status check is not required
  if (!requiresDailyStatusCheck) {
    return null;
  }

  // Size variants
  const getSizeClasses = (size: 'sm' | 'md' | 'lg'): string => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-3 py-1 text-sm';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  // Variant styles
  const getVariantClasses = (variant: 'filled' | 'outlined'): string => {
    switch (variant) {
      case 'filled':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'outlined':
        return 'bg-white text-orange-800 border-orange-300';
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const iconSizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <span 
      className={`
        inline-flex items-center gap-1 font-medium rounded-full border
        ${getVariantClasses(variant)}
        ${getSizeClasses(size)}
      `}
      title={TEXT_CONSTANTS.FEATURES.EQUIPMENT.REQUIRES_DAILY_STATUS_CHECK}
    >
      <span className={iconSizeClass}>📊</span>
      {TEXT_CONSTANTS.FEATURES.EQUIPMENT.REQUIRES_DAILY_CHECK}
    </span>
  );
}
