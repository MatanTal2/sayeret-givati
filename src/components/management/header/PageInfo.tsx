/**
 * Page info component showing current tab details
 */
import React from 'react';
import type { ManagementTab } from '@/types/management';

export interface PageInfoProps {
  tab: ManagementTab;
}

export default function PageInfo({ tab }: PageInfoProps) {
  const Icon = tab.icon;

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary-600" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{tab.label}</h1>
        <p className="text-sm text-neutral-600">{tab.description}</p>
      </div>
    </div>
  );
}

