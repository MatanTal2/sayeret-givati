'use client';

import { EquipmentStatus as StatusType } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';

interface EquipmentStatusProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined';
}

export default function EquipmentStatus({ status, size = 'md', variant = 'filled' }: EquipmentStatusProps) {
  // Status to display text mapping
  const getStatusText = (status: StatusType): string => {
    switch (status) {
      case StatusType.AVAILABLE:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_AVAILABLE;
      case StatusType.SECURITY:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_SECURITY;
      case StatusType.REPAIR:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_REPAIR;
      case StatusType.LOST:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_LOST;
      case StatusType.PENDING_TRANSFER:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_PENDING_TRANSFER;
      default:
        return status;
    }
  };

  // Status to color mapping - following app's design patterns
  const getStatusColor = (status: StatusType): string => {
    if (variant === 'outlined') {
      switch (status) {
        case StatusType.AVAILABLE:
          return 'bg-transparent text-success-700 border border-success-700';
        case StatusType.SECURITY:
          return 'bg-transparent text-info-700 border border-info-700';
        case StatusType.REPAIR:
          return 'bg-transparent text-orange-700 border border-orange-700';
        case StatusType.LOST:
          return 'bg-transparent text-danger-700 border border-danger-700';
        case StatusType.PENDING_TRANSFER:
          return 'bg-transparent text-warning-700 border border-warning-700';
        default:
          return 'bg-transparent text-neutral-700 border border-neutral-700';
      }
    } else {
      // Filled variant (original)
      switch (status) {
        case StatusType.AVAILABLE:
          return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
        case StatusType.SECURITY:
          return 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-200';
        case StatusType.REPAIR:
          return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        case StatusType.LOST:
          return 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200';
        case StatusType.PENDING_TRANSFER:
          return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200';
        default:
          return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200';
      }
    }
  };

  // Size variants following app's design system
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

  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full
        ${getStatusColor(status)}
        ${getSizeClasses(size)}
      `}
      title={getStatusText(status)}
    >
      {getStatusText(status)}
    </span>
  );
}
