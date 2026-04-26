'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import type { Equipment } from '@/types/equipment';
import type { EnhancedAuthUser } from '@/types/user';
import { canReport, canRetire, canTransfer } from '@/lib/equipmentPolicy';
import { TEXT_CONSTANTS } from '@/constants/text';

export type EquipmentRowAction = 'report' | 'transfer' | 'return' | 'history';

interface EquipmentRowActionsProps {
  equipment: Equipment;
  user: EnhancedAuthUser;
  onAction: (action: EquipmentRowAction) => void;
}

export default function EquipmentRowActions({ equipment, user, onAction }: EquipmentRowActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.ROW_ACTIONS;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const ctx = { user, equipment };
  const items: Array<{ id: EquipmentRowAction; label: string; show: boolean; tone?: 'danger' }> = [
    { id: 'report', label: labels.REPORT, show: canReport(ctx) },
    { id: 'transfer', label: labels.TRANSFER, show: canTransfer(ctx) },
    { id: 'return', label: labels.RETURN, show: canRetire(ctx), tone: 'danger' },
    { id: 'history', label: labels.HISTORY, show: true },
  ];

  const visible = items.filter((i) => i.show);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={labels.MORE}
        aria-expanded={open}
        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 mt-1 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg z-30 py-1"
        >
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onAction(item.id); }}
              className={`w-full text-start px-3 py-2 text-sm transition-colors ${
                item.tone === 'danger'
                  ? 'text-danger-600 hover:bg-danger-50'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
