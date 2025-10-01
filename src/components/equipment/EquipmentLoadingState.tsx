'use client';

import { TEXT_CONSTANTS } from '@/constants/text';

interface EquipmentLoadingStateProps {
  count?: number;
  compact?: boolean;
}

export default function EquipmentLoadingState({ 
  count = 6, 
  compact = false 
}: EquipmentLoadingStateProps) {
  return (
    <div className="space-y-6">
      {/* Loading header */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg text-gray-600 dark:text-gray-400">
            {TEXT_CONSTANTS.FEATURES.EQUIPMENT.LOADING_EQUIPMENT}
          </span>
        </div>
      </div>

      {/* Loading cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`
              bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
              ${compact ? 'p-4' : 'p-6'}
              animate-pulse
            `}
          >
            {/* Header skeleton */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-1"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              </div>
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                </div>
                <div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-1"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-28"></div>
                </div>
                <div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="flex-1 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-10 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
