'use client';

import React from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { HelpCircle } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { cn } from '@/lib/cn';

export interface InfoPopoverProps {
  /**
   * Short explanatory text to render inside the bubble. Plain string only —
   * upstream is responsible for i18n via `TEXT_CONSTANTS`.
   */
  content: string;
  /**
   * Optional accessible name for the trigger button. Falls back to the
   * `INFO_BUBBLE_LABEL` text constant.
   */
  ariaLabel?: string;
  /**
   * Extra classes for the trigger wrapper (icon button).
   */
  className?: string;
}

/**
 * Small "?" icon that reveals a tooltip-style bubble.
 *
 * Built on Headless UI `Popover`:
 *   - Desktop: hover OR click opens the panel (close on outside click / Escape).
 *   - Mobile: tap toggles.
 *
 * Sits at `z-60` so it floats above the surrounding `MenuItems` panel (z-50).
 */
export default function InfoPopover({ content, ariaLabel, className }: InfoPopoverProps) {
  const label = ariaLabel ?? TEXT_CONSTANTS.FEATURES.EQUIPMENT.STORAGE.INFO_BUBBLE_LABEL;

  return (
    <Popover className={cn('relative inline-flex items-center', className)}>
      {({ open, close }) => (
        <span
          // Hover support on pointer-fine devices. Touch devices fire click
          // on tap, which Headless Popover already handles, so a no-op here
          // is harmless on mobile.
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse' && !open) {
              (e.currentTarget.querySelector('[data-info-trigger]') as HTMLButtonElement | null)?.click();
            }
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse' && open) {
              close();
            }
          }}
        >
          <PopoverButton
            type="button"
            data-info-trigger
            data-info-content={content}
            aria-label={label}
            title={content}
            className="inline-flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            onClick={(e) => {
              // Prevent the surrounding MenuItem button from receiving the
              // click and triggering its disabled-action handler.
              e.stopPropagation();
            }}
          >
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </PopoverButton>
          <PopoverPanel
            anchor={{ to: 'top', gap: 6 }}
            role="tooltip"
            className="z-60 bg-neutral-900 text-white text-xs rounded-md px-2 py-1 shadow-lg max-w-[220px] leading-snug"
          >
            {content}
          </PopoverPanel>
        </span>
      )}
    </Popover>
  );
}
