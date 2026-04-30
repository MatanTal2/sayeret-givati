'use client';

import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { MoreVertical } from 'lucide-react';
import type { Equipment } from '@/types/equipment';
import type { EnhancedAuthUser } from '@/types/user';
import { canReport, canRetire, canTransfer } from '@/lib/equipmentPolicy';
import { TEXT_CONSTANTS } from '@/constants/text';
import { cn } from '@/lib/cn';

export type EquipmentRowAction = 'report' | 'transfer' | 'return' | 'history';

interface EquipmentRowActionsProps {
  equipment: Equipment;
  user: EnhancedAuthUser;
  onAction: (action: EquipmentRowAction) => void;
}

interface ActionItem {
  id: EquipmentRowAction;
  label: string;
  show: boolean;
  tone?: 'danger';
}

export default function EquipmentRowActions({ equipment, user, onAction }: EquipmentRowActionsProps) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.ROW_ACTIONS;

  const ctx = { user, equipment };
  const safeItems: ActionItem[] = ([
    { id: 'report', label: labels.REPORT, show: canReport(ctx) },
    { id: 'transfer', label: labels.TRANSFER, show: canTransfer(ctx) },
    { id: 'history', label: labels.HISTORY, show: true },
  ] as ActionItem[]).filter((i) => i.show);

  const dangerItems: ActionItem[] = ([
    { id: 'return', label: labels.RETURN, show: canRetire(ctx), tone: 'danger' },
  ] as ActionItem[]).filter((i) => i.show);

  return (
    <Menu as="div" className="relative inline-block">
      <MenuButton
        aria-label={labels.MORE}
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
              onClick={() => onAction(item.id)}
              className={cn(
                'w-full text-start px-3 py-2 text-sm transition-colors text-neutral-700',
                'data-[focus]:bg-neutral-50',
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
              onClick={() => onAction(item.id)}
              className={cn(
                'w-full text-start px-3 py-2 text-sm transition-colors text-danger-600',
                'data-[focus]:bg-danger-50',
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
