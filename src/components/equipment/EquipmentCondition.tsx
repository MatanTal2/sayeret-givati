'use client';

import { EquipmentCondition as ConditionType } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';

interface EquipmentConditionProps {
  condition: ConditionType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function EquipmentCondition({ 
  condition, 
  size = 'md', 
  showIcon = true 
}: EquipmentConditionProps) {
  // Condition to display text mapping
  const getConditionText = (condition: ConditionType): string => {
    switch (condition) {
      case ConditionType.NEW:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_NEW;
      case ConditionType.EXCELLENT:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_EXCELLENT;
      case ConditionType.GOOD:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_GOOD;
      case ConditionType.FAIR:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_FAIR;
      case ConditionType.POOR:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_POOR;
      case ConditionType.NEEDS_REPAIR:
        return TEXT_CONSTANTS.FEATURES.EQUIPMENT.CONDITION_NEEDS_REPAIR;
      default:
        return condition;
    }
  };

  // Condition to color mapping - using semantic colors
  const getConditionColor = (condition: ConditionType): string => {
    switch (condition) {
      case ConditionType.NEW:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case ConditionType.EXCELLENT:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case ConditionType.GOOD:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case ConditionType.FAIR:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case ConditionType.POOR:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case ConditionType.NEEDS_REPAIR:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Condition to icon mapping - visual indicators
  const getConditionIcon = (condition: ConditionType): string => {
    switch (condition) {
      case ConditionType.NEW:
        return '✨';
      case ConditionType.EXCELLENT:
        return '⭐';
      case ConditionType.GOOD:
        return '👍';
      case ConditionType.FAIR:
        return '👌';
      case ConditionType.POOR:
        return '👎';
      case ConditionType.NEEDS_REPAIR:
        return '🔧';
      default:
        return '❓';
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

  const iconSizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <span 
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        ${getConditionColor(condition)}
        ${getSizeClasses(size)}
      `}
      title={getConditionText(condition)}
    >
      {showIcon && (
        <span className={iconSizeClass}>
          {getConditionIcon(condition)}
        </span>
      )}
      {getConditionText(condition)}
    </span>
  );
}
