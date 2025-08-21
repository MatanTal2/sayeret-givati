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
      case StatusType.IN_USE:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_IN_USE;
      case StatusType.MAINTENANCE:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_MAINTENANCE;
      case StatusType.REPAIR:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_REPAIR;
      case StatusType.LOST:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_LOST;
      case StatusType.RETIRED:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_RETIRED;
      default:
        return status;
    }
  };

  // Status to color mapping - following app's design patterns
  const getStatusColor = (status: StatusType): string => {
    if (variant === 'outlined') {
      switch (status) {
        case StatusType.AVAILABLE:
          return 'bg-transparent text-green-700 border border-green-700';
        case StatusType.IN_USE:
          return 'bg-transparent text-blue-700 border border-blue-700';
        case StatusType.MAINTENANCE:
          return 'bg-transparent text-yellow-700 border border-yellow-700';
        case StatusType.REPAIR:
          return 'bg-transparent text-orange-700 border border-orange-700';
        case StatusType.LOST:
          return 'bg-transparent text-red-700 border border-red-700';
        case StatusType.RETIRED:
          return 'bg-transparent text-gray-700 border border-gray-700';
        default:
          return 'bg-transparent text-gray-700 border border-gray-700';
      }
    } else {
      // Filled variant (original)
      switch (status) {
        case StatusType.AVAILABLE:
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case StatusType.IN_USE:
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case StatusType.MAINTENANCE:
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case StatusType.REPAIR:
          return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        case StatusType.LOST:
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case StatusType.RETIRED:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
