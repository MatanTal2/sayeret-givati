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
 * Combined header row for `/equipment`. Under `dir="rtl"`, flex-start
 * packs items from the visual right — so with DOM order **Add-button
 * first, toggle-group second**, the button lands on the visual right
 * and the toggle sits immediately to its left, clustered (no spacer
 * between them, no `justify-between`). The `mt-8` keeps the bar from
 * collapsing onto the `EquipmentTabs` underline above. Switch ON
 * (colored) = active view; OFF (neutral) = archive view. Archive count
 * badge surfaces only while viewing the archive. The Switch thumb uses
 * logical `start-*` positioning so it flips correctly under
 * `dir="rtl"` (mirrors the SystemConfigTab + NotificationToggleRow
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
  const isActive = !isArchive;
  const stateLabel = isArchive ? labels.SHOW_ARCHIVE : labels.SHOW_ACTIVE;

  return (
    <div className="flex flex-wrap items-center gap-3 gap-y-2 mt-8 mb-4">
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

      <div className="flex items-center gap-2">
        <Switch
          checked={isActive}
          onChange={(next) => onViewChange(next ? 'active' : 'archive')}
          aria-label={labels.TOGGLE_ARIA}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            isActive ? 'bg-primary-600' : 'bg-neutral-300',
          )}
        >
          <span
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
              isActive ? 'start-6' : 'start-1',
            )}
          />
        </Switch>
        <span className="text-sm font-medium text-neutral-700">{stateLabel}</span>
        {isArchive && archiveCount > 0 && (
          <span
            className="inline-flex items-center justify-center text-xs rounded-full min-w-[1.25rem] h-5 px-1.5 bg-neutral-100 text-neutral-700"
            aria-label={`${archiveCount}`}
          >
            {archiveCount}
          </span>
        )}
      </div>
    </div>
  );
}
