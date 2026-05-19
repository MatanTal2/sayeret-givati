'use client';

import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { MoreVertical } from 'lucide-react';
import { Equipment, EquipmentStatus } from '@/types/equipment';
import type { EnhancedAuthUser } from '@/types/user';
import {
  canReport,
  canRetire,
  canRequestExchange,
  canApproveExchange,
  canReplaceByAnother,
  canSendToStorage,
  canPullFromStorage,
  isHolder,
} from '@/lib/equipmentPolicy';
import { TEXT_CONSTANTS } from '@/constants/text';
import { cn } from '@/lib/cn';
import InfoPopover from '@/components/ui/InfoPopover';

export type EquipmentRowAction =
  | 'report'
  | 'transfer'
  | 'return'
  | 'history'
  | 'request-exchange'
  | 'approve-exchange'
  | 'reject-exchange'
  | 'replace-by-another'
  | 'send-to-storage'
  | 'pull-from-storage';

interface EquipmentRowActionsProps {
  equipment: Equipment;
  user: EnhancedAuthUser;
  /**
   * When true, the pull-from-storage action is rendered enabled. When false,
   * the row is disabled and an info-bubble explains why.
   * Set by the parent via SystemConfig.roundOpen.
   */
  roundOpen?: boolean;
  onAction: (action: EquipmentRowAction) => void;
}

interface ActionItem {
  id: EquipmentRowAction;
  label: string;
  show: boolean;
  disabled?: boolean;
  /** Explanatory text rendered in an InfoPopover when the row is disabled. */
  infoBubble?: string;
  tone?: 'danger';
}

export default function EquipmentRowActions({ equipment, user, roundOpen, onAction }: EquipmentRowActionsProps) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.ROW_ACTIONS;
  const storageText = TEXT_CONSTANTS.FEATURES.EQUIPMENT.STORAGE;

  const ctx = { user, equipment };

  // Transfer visibility intentionally inline (does NOT call canTransfer):
  // the policy hides STORED items, but we want to render the row disabled
  // with a bubble explaining "pull from storage first". Server-side
  // canTransfer is unchanged and still enforces the policy.
  const transferVisible = isHolder(ctx) && equipment.status !== EquipmentStatus.RETIRED;
  const transferDisabledByStorage = equipment.status === EquipmentStatus.STORED;

  const safeItems: ActionItem[] = ([
    { id: 'report', label: labels.REPORT, show: canReport(ctx) },
    {
      id: 'transfer',
      label: labels.TRANSFER,
      show: transferVisible,
      disabled: transferDisabledByStorage,
      infoBubble: transferDisabledByStorage ? storageText.TRANSFER_BLOCKED_STORED_TOOLTIP : undefined,
    },
    { id: 'request-exchange', label: labels.REQUEST_EXCHANGE, show: canRequestExchange(ctx) },
    { id: 'approve-exchange', label: labels.APPROVE_EXCHANGE, show: canApproveExchange(ctx) },
    { id: 'replace-by-another', label: labels.REPLACE_BY_ANOTHER, show: canReplaceByAnother(ctx) },
    { id: 'send-to-storage', label: labels.SEND_TO_STORAGE, show: canSendToStorage(ctx) },
    {
      id: 'pull-from-storage',
      label: labels.PULL_FROM_STORAGE,
      show: canPullFromStorage(ctx),
      disabled: !roundOpen,
      infoBubble: !roundOpen ? storageText.ROUND_CLOSED_TOOLTIP : undefined,
    },
    { id: 'history', label: labels.HISTORY, show: true },
  ] as ActionItem[]).filter((i) => i.show);

  const dangerItems: ActionItem[] = ([
    { id: 'reject-exchange', label: labels.REJECT_EXCHANGE, show: canApproveExchange(ctx), tone: 'danger' },
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
        className="w-52 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50 focus:outline-none"
      >
        {safeItems.map((item) => {
          const showBubble = !!item.disabled && !!item.infoBubble;
          return (
            <MenuItem key={item.id} disabled={item.disabled}>
              <div className="flex items-center justify-between gap-1 pe-2">
                <button
                  type="button"
                  onClick={() => !item.disabled && onAction(item.id)}
                  className={cn(
                    'flex-1 text-start px-3 py-2 text-sm transition-colors text-neutral-700',
                    'data-[focus]:bg-neutral-50',
                    item.disabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {item.label}
                </button>
                {showBubble && (
                  <InfoPopover content={item.infoBubble!} />
                )}
              </div>
            </MenuItem>
          );
        })}
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
