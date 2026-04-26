'use client';

import React from 'react';
import { Package, Layers } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';
import type { WizardMode } from './types';

interface Props {
  mode: WizardMode;
  onChange: (mode: WizardMode) => void;
}

export default function WizardStepMode({ mode, onChange }: Props) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.WIZARD;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-neutral-700">{labels.STEP_MODE}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ModeCard
          active={mode === 'single'}
          icon={<Package className="w-6 h-6" />}
          title={labels.MODE_SINGLE}
          onClick={() => onChange('single')}
        />
        <ModeCard
          active={mode === 'bulk'}
          icon={<Layers className="w-6 h-6" />}
          title={labels.MODE_BULK}
          subtitle={labels.MODE_BULK_HINT}
          onClick={() => onChange('bulk')}
        />
      </div>
    </div>
  );
}

function ModeCard({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl border text-start transition-all ${
        active
          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
      }`}
    >
      <div className={`mb-2 ${active ? 'text-primary-600' : 'text-neutral-500'}`}>{icon}</div>
      <div className="text-sm font-medium text-neutral-900">{title}</div>
      {subtitle && <div className="text-xs text-neutral-500 mt-1">{subtitle}</div>}
    </button>
  );
}
