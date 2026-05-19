'use client';

import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TEXT_CONSTANTS } from '@/constants/text';

export type PersonnelRowAction = 'edit' | 'delete';

interface PersonnelRowActionsProps {
  onAction: (action: PersonnelRowAction) => void;
  /** Disables the trigger while a parent operation is in flight. */
  disabled?: boolean;
}

/**
 * 3-dots menu for a personnel row. Mirrors `EquipmentRowActions` in shape:
 * safe actions on top, destructive actions below a separator.
 */
export default function PersonnelRowActions({ onAction, disabled }: PersonnelRowActionsProps) {
  const labels = TEXT_CONSTANTS.FEATURES.ADMIN.PERSONNEL;

  return (
    <Menu as="div" className="relative inline-block">
      <MenuButton
        aria-label={labels.ACTIONS_MORE_ARIA}
        disabled={disabled}
        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <MoreVertical className="w-4 h-4" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="w-40 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50 focus:outline-none"
      >
        <MenuItem>
          <button
            type="button"
            onClick={() => onAction('edit')}
            className={cn(
              'w-full text-start px-3 py-2 text-sm transition-colors text-neutral-700',
              'data-[focus]:bg-neutral-50',
            )}
          >
            {labels.EDIT}
          </button>
        </MenuItem>
        <div className="my-1 border-t border-neutral-200" role="separator" />
        <MenuItem>
          <button
            type="button"
            onClick={() => onAction('delete')}
            className={cn(
              'w-full text-start px-3 py-2 text-sm transition-colors text-danger-600',
              'data-[focus]:bg-danger-50',
            )}
          >
            {labels.DELETE}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
