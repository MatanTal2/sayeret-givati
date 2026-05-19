'use client';

import { Switch } from '@headlessui/react';
import { Plus } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { cn } from '@/lib/cn';

interface EquipmentToolbarProps {
  view: 'active' | 'archive';
  onViewChange: (next: 'active' | 'archive') => void;
  archiveCount: number;
  onAddClick: () => void;
  canAdd: boolean;
}

/**
 * Combined header row for `/equipment` — pairs the active/archive Switch
 * (with a dynamic label + archive count badge) and the "Add Item" button in
 * a single line. RTL: toggle group sits on visual right, Add Item on visual
 * left. The Switch thumb uses logical `start-*` positioning so it flips
 * correctly under `dir="rtl"` (mirrors the SystemConfigTab + NotificationToggleRow
 * pattern — `translate-x-*` is physical and breaks in RTL).
 */
export default function EquipmentToolbar({
  view,
  onViewChange,
  archiveCount,
  onAddClick,
  canAdd,
}: EquipmentToolbarProps) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.ARCHIVE;
  const isArchive = view === 'archive';
  const stateLabel = isArchive ? labels.SHOW_ARCHIVE : labels.SHOW_ACTIVE;

  return (
    <div className="flex flex-wrap items-center gap-3 gap-y-2 mb-4">
      <div className="flex items-center gap-2">
        <Switch
          checked={isArchive}
          onChange={(next) => onViewChange(next ? 'archive' : 'active')}
          aria-label={labels.TOGGLE_ARIA}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            isArchive ? 'bg-primary-600' : 'bg-neutral-300',
          )}
        >
          <span
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
              isArchive ? 'start-6' : 'start-1',
            )}
          />
        </Switch>
        <span className="text-sm font-medium text-neutral-700">{stateLabel}</span>
        {archiveCount > 0 && (
          <span
            className="inline-flex items-center justify-center text-xs rounded-full min-w-[1.25rem] h-5 px-1.5 bg-neutral-100 text-neutral-700"
            aria-label={`${archiveCount}`}
          >
            {archiveCount}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {canAdd && (
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {TEXT_CONSTANTS.FEATURES.EQUIPMENT.ADD_NEW}
        </button>
      )}
    </div>
  );
}
