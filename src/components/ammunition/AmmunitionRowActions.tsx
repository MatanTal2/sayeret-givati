'use client';

import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { MoreVertical } from 'lucide-react';
import { FEATURES } from '@/constants/text';
import { cn } from '@/lib/cn';

const T = FEATURES.AMMUNITION;

export type AmmunitionRowAction = 'transfer' | 'return-to-mgr' | 'return-to-unit' | 'delete';

interface ActionItem {
  id: AmmunitionRowAction;
  label: string;
  show: boolean;
  tone?: 'danger';
}

interface AmmunitionRowActionsProps {
  showTransfer: boolean;
  showReturn: boolean;
  showReturnToUnit?: boolean;
  showDelete: boolean;
  onAction: (action: AmmunitionRowAction) => void;
}

export default function AmmunitionRowActions({
  showTransfer,
  showReturn,
  showReturnToUnit = false,
  showDelete,
  onAction,
}: AmmunitionRowActionsProps) {
  const labels = T.INVENTORY_ACTIONS;

  const safeItems: ActionItem[] = ([
    { id: 'transfer', label: labels.TRANSFER, show: showTransfer },
    { id: 'return-to-mgr', label: labels.RETURN_TO_MGR, show: showReturn },
    { id: 'return-to-unit', label: labels.RETURN_TO_UNIT, show: showReturnToUnit },
  ] as ActionItem[]).filter((i) => i.show);

  const dangerItems: ActionItem[] = ([
    { id: 'delete', label: labels.DELETE, show: showDelete, tone: 'danger' },
  ] as ActionItem[]).filter((i) => i.show);

  if (safeItems.length === 0 && dangerItems.length === 0) return null;

  return (
    <Menu as="div" className="relative inline-block">
      <MenuButton
        aria-label={labels.MORE}
        onClick={(e) => e.stopPropagation()}
        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="w-44 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50 focus:outline-none"
      >
        {safeItems.map((item) => (
          <MenuItem key={item.id}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction(item.id);
              }}
              className={cn(
                'w-full text-start px-3 py-2 text-sm transition-colors text-neutral-700',
                'data-[focus]:bg-neutral-50'
              )}
            >
              {item.label}
            </button>
          </MenuItem>
        ))}
        {safeItems.length > 0 && dangerItems.length > 0 && (
          <div className="my-1 border-t border-neutral-200" role="separator" />
        )}
        {dangerItems.map((item) => (
          <MenuItem key={item.id}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction(item.id);
              }}
              className={cn(
                'w-full text-start px-3 py-2 text-sm transition-colors text-danger-600',
                'data-[focus]:bg-danger-50'
              )}
            >
              {item.label}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
