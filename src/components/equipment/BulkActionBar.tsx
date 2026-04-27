'use client';

import React from 'react';
import { X } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';

export type BulkAction = 'report' | 'transfer' | 'retire';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onAction: (action: BulkAction) => void;
  allowReport?: boolean;
  allowTransfer?: boolean;
  allowRetire?: boolean;
}

export default function BulkActionBar({
  selectedCount,
  onClear,
  onAction,
  allowReport = true,
  allowTransfer = true,
  allowRetire = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.BULK;

  return (
    <div
      className="sticky bottom-4 z-20 mx-auto max-w-3xl bg-neutral-900 text-white rounded-xl shadow-xl px-4 py-3 flex items-center justify-between gap-3"
      role="region"
      aria-label="Bulk actions"
    >
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={onClear}
          className="p-1 rounded-md hover:bg-neutral-700 transition-colors"
          aria-label={labels.CLEAR}
        >
          <X className="w-4 h-4" />
        </button>
        <span>{labels.SELECTED.replace('{count}', String(selectedCount))}</span>
      </div>
      <div className="flex items-center gap-2">
        {allowReport && (
          <button
            type="button"
            onClick={() => onAction('report')}
            className="px-3 py-1.5 text-sm rounded-md bg-primary-600 hover:bg-primary-500 transition-colors"
          >
            {labels.REPORT}
          </button>
        )}
        {allowTransfer && (
          <button
            type="button"
            onClick={() => onAction('transfer')}
            className="px-3 py-1.5 text-sm rounded-md bg-info-600 hover:bg-info-500 transition-colors"
          >
            {labels.TRANSFER}
          </button>
        )}
        {allowRetire && (
          <button
            type="button"
            onClick={() => onAction('retire')}
            className="px-3 py-1.5 text-sm rounded-md bg-danger-600 hover:bg-danger-500 transition-colors"
          >
            {labels.RETIRE}
          </button>
        )}
      </div>
    </div>
  );
}
