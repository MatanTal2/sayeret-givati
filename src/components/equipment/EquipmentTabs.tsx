'use client';

import React from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import type { EquipmentScope } from '@/hooks/useEquipment';
import { isManagerOrAbove } from '@/lib/equipmentPolicy';
import type { EnhancedAuthUser } from '@/types/user';

interface EquipmentTabsProps {
  scope: EquipmentScope;
  onChange: (scope: EquipmentScope) => void;
  user: EnhancedAuthUser | null;
  counts?: Partial<Record<EquipmentScope, number>>;
}

export default function EquipmentTabs({ scope, onChange, user, counts }: EquipmentTabsProps) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.TABS;
  const showAll = !!user && isManagerOrAbove(user);

  const tabs: Array<{ id: EquipmentScope; label: string }> = [
    { id: 'self', label: labels.SELF },
    { id: 'team', label: labels.TEAM },
  ];
  if (showAll) tabs.push({ id: 'all', label: labels.ALL });

  return (
    <div className="border-b border-neutral-200 bg-white rounded-t-xl">
      <nav className="flex" role="tablist" aria-label="Equipment scope">
        {tabs.map((t) => {
          const active = t.id === scope;
          const count = counts?.[t.id];
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {t.label}
              {typeof count === 'number' && (
                <span
                  className={`ms-2 inline-flex items-center justify-center min-w-[1.5rem] px-1.5 text-xs rounded-full ${
                    active ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
