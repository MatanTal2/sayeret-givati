'use client';

import { TEXT_CONSTANTS } from '@/constants/text';

interface EquipmentEmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
  isFiltered?: boolean;
}

export default function EquipmentEmptyState({
  title,
  description,
  actionText,
  onAction,
  icon = '📦',
  isFiltered = false
}: EquipmentEmptyStateProps) {
  const defaultTitle = isFiltered 
    ? TEXT_CONSTANTS.FEATURES.EQUIPMENT.NO_ITEMS_FOUND
    : TEXT_CONSTANTS.FEATURES.EQUIPMENT.NO_EQUIPMENT;
    
  const defaultDescription = isFiltered
    ? TEXT_CONSTANTS.FEATURES.EQUIPMENT.CHANGE_SEARCH_PARAMS
    : TEXT_CONSTANTS.FEATURES.EQUIPMENT.ADD_EQUIPMENT_TO_START;

  return (
    <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700">
      <div className="text-6xl mb-6">
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
        {title || defaultTitle}
      </h3>
      
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
        {description || defaultDescription}
      </p>
      
      {onAction && actionText && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-info-600 text-white font-medium rounded-lg 
                     hover:bg-info-700 transition-colors duration-200
                     focus:ring-2 focus:ring-info-500 focus:ring-offset-2"
        >
          {actionText}
        </button>
      )}
      
      {isFiltered && (
        <div className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          💡 {TEXT_CONSTANTS.FEATURES.EQUIPMENT.SEARCH_TIP}
        </div>
      )}
    </div>
  );
}
