'use client';

import { Equipment } from '@/types/equipment';
import { TEXT_FMT } from '@/constants/text';
import { Timestamp } from 'firebase/firestore';
import EquipmentStatus from './EquipmentStatus';
import EquipmentCondition from './EquipmentCondition';
import DailyStatusBadge from './DailyStatusBadge';

interface EquipmentCardProps {
  equipment: Equipment;
  onTransfer?: (equipmentId: string) => void;
  onUpdateStatus?: (equipmentId: string) => void;
  onViewHistory?: (equipmentId: string) => void;
  compact?: boolean;
}

export default function EquipmentCard({ 
  equipment, 
  onTransfer,
  onUpdateStatus,
  onViewHistory,
  compact = false 
}: EquipmentCardProps) {
  
  // Format time ago (similar to app's existing patterns)
  const formatTimeAgo = (timestamp: Timestamp | string): string => {
    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 24) {
        return TEXT_FMT.HOURS_AGO(diffInHours);
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return TEXT_FMT.DAYS_AGO(diffInDays);
      }
    } catch {
      return 'זמן לא ידוע';
    }
  };

  // Get equipment category icon
  const getCategoryIcon = (category: string): string => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('נשק') || categoryLower.includes('רובה')) return '🔫';
    if (categoryLower.includes('אופטיקה') || categoryLower.includes('משקפי') || categoryLower.includes('כוונת')) return '🔭';
    if (categoryLower.includes('תקשורת') || categoryLower.includes('קשר')) return '📡';
    if (categoryLower.includes('הגנה') || categoryLower.includes('אפוד')) return '🛡️';
    if (categoryLower.includes('ציוד') || categoryLower.includes('תיק')) return '🎒';
    return '⚙️'; // Default
  };

  // Use neutral colors like the main app
  const getCardStyling = () => {
    return 'from-gray-100 to-gray-200 text-gray-800';
  };

  return (
    <div className={`
      relative rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 
      bg-gradient-to-br ${getCardStyling()} cursor-pointer border border-gray-200
      ${compact ? 'p-4 h-32' : 'p-6 h-40'}
    `}>
      {/* Horizontal Layout */}
      <div className="flex items-center h-full gap-4">
        {/* Left: Icon and Basic Info */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getCategoryIcon(equipment.category)}</div>
          <div>
            <h3 className="text-sm font-bold">#{equipment.id}</h3>
            <p className="text-xs font-semibold">{equipment.productName}</p>
            <p className="text-xs opacity-75">{equipment.category}</p>
          </div>
        </div>

        {/* Center: Key Info */}
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center">
            <span className="mr-1">👤</span>
            <span className="truncate">{equipment.currentHolder}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1">🏛️</span>
            <span className="truncate">{equipment.assignedUnit}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1">📍</span>
            <span className="truncate">{equipment.location}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1">⏰</span>
            <span className="truncate">{formatTimeAgo(equipment.lastReportUpdate)}</span>
          </div>
        </div>

        {/* Right: Status, Condition, Daily Check & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <EquipmentStatus status={equipment.status} size="sm" variant="outlined" />
            <EquipmentCondition condition={equipment.condition} size="sm" showIcon={false} variant="outlined" />
            <DailyStatusBadge requiresDailyStatusCheck={equipment.requiresDailyStatusCheck || false} size="sm" variant="outlined" />
          </div>
          
          <div className="flex gap-1">
            {onTransfer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTransfer(equipment.id);
                }}
                className="px-2 py-1 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white
                           rounded-md transition-colors"
              >
                העבר
              </button>
            )}
            
            {onUpdateStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(equipment.id);
                }}
                className="px-2 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white
                           rounded-md transition-colors"
              >
                עדכן
              </button>
            )}
            
            {onViewHistory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory(equipment.id);
                }}
                className="px-2 py-1 text-xs font-medium bg-green-600 hover:bg-green-700 text-white
                           rounded-md transition-colors"
              >
                📋
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes indicator (if exists) */}
      {equipment.notes && (
        <div className="absolute bottom-2 left-2 text-xs opacity-75">
          💬
        </div>
      )}
    </div>
  );
}
