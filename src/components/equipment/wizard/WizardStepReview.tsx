'use client';

import React from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import type { EquipmentType } from '@/types/equipment';
import type { WizardItemDraft } from './types';

interface Props {
  template: EquipmentType;
  items: WizardItemDraft[];
}

export default function WizardStepReview({ template, items }: Props) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.WIZARD;
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3">
        <div className="text-xs text-neutral-500">{labels.TEMPLATE}</div>
        <div className="text-sm font-medium text-neutral-900">{template.name}</div>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          const previewUrl = item.photoBlob ? URL.createObjectURL(item.photoBlob) : item.photoUrl ?? null;
          return (
            <li key={item.uid} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="" className="w-12 h-12 rounded-md object-cover bg-neutral-100" />
              ) : (
                <div className="w-12 h-12 rounded-md bg-neutral-100" />
              )}
              <div className="flex-1 text-sm">
                <div className="font-medium text-neutral-900">
                  {labels.ITEM_NUMBER.replace('{n}', String(idx + 1)).replace('{total}', String(items.length))}
                </div>
                {template.requiresSerialNumber && (
                  <div className="text-xs text-neutral-600">{labels.SERIAL_LABEL}: {item.serialNumber || '—'}</div>
                )}
                {item.catalogNumber && (
                  <div className="text-xs text-neutral-600">{labels.CATALOG_LABEL}: {item.catalogNumber}</div>
                )}
                {item.location && (
                  <div className="text-xs text-neutral-600">{labels.LOCATION_LABEL}: {item.location}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
