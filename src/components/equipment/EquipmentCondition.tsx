'use client';

import { EquipmentCondition as ConditionType } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';

interface EquipmentConditionProps {
  condition: ConditionType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'filled' | 'outlined';
}

export default function EquipmentCondition({ 
  condition, 
  size = 'md', 
  showIcon = true,
  variant = 'filled'
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
    const colorMap = {
      [ConditionType.NEW]: 'emerald',
      [ConditionType.EXCELLENT]: 'green', 
      [ConditionType.GOOD]: 'blue',
      [ConditionType.FAIR]: 'yellow',
      [ConditionType.POOR]: 'orange',
      [ConditionType.NEEDS_REPAIR]: 'red'
    };
    
    const color = colorMap[condition] || 'gray';
    
    if (variant === 'outlined') {
      return `bg-transparent text-${color}-700 border border-${color}-700`;
    } else {
      return `bg-${color}-100 text-${color}-800 dark:bg-${color}-900 dark:text-${color}-200`;
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
