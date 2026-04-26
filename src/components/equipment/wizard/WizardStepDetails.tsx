'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { type EquipmentType } from '@/types/equipment';
import CameraCapture from '@/components/camera/CameraCapture';
import { type WizardItemDraft, createEmptyItem } from './types';

interface Props {
  template: EquipmentType;
  items: WizardItemDraft[];
  isBulk: boolean;
  onChange: (items: WizardItemDraft[]) => void;
}

export default function WizardStepDetails({ template, items, isBulk, onChange }: Props) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.WIZARD;

  const updateItem = (index: number, patch: Partial<WizardItemDraft>) => {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange(next);
  };

  const addAnother = () => {
    onChange([...items, createEmptyItem({ catalogNumber: template.defaultCatalogNumber ?? '' })]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <ItemEditor
          key={item.uid}
          template={template}
          item={item}
          index={index}
          total={items.length}
          showHeader={isBulk}
          onChange={(patch) => updateItem(index, patch)}
          onRemove={items.length > 1 ? () => removeItem(index) : undefined}
        />
      ))}
      {isBulk && (
        <button
          type="button"
          onClick={addAnother}
          className="w-full p-3 rounded-lg border border-dashed border-neutral-300 text-sm text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {labels.ADD_ANOTHER}
        </button>
      )}
    </div>
  );
}

interface ItemEditorProps {
  template: EquipmentType;
  item: WizardItemDraft;
  index: number;
  total: number;
  showHeader: boolean;
  onChange: (patch: Partial<WizardItemDraft>) => void;
  onRemove?: () => void;
}

function ItemEditor({ template, item, index, total, showHeader, onChange, onRemove }: ItemEditorProps) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.WIZARD;
  const [previewUrl, setPreviewUrl] = useState<string | null>(() =>
    item.photoBlob ? URL.createObjectURL(item.photoBlob) : null,
  );

  const handleCapture = (blob: Blob) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    onChange({ photoBlob: blob, photoUrl: null });
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onChange({ photoBlob: null });
  };

  const photoFromDraft = !item.photoBlob && item.photoUrl;

  return (
    <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-neutral-700">
            {labels.ITEM_NUMBER.replace('{n}', String(index + 1)).replace('{total}', String(total))}
          </h4>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-md text-danger-600 hover:bg-danger-50"
              aria-label={labels.REMOVE_ITEM}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {template.requiresSerialNumber && (
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">{labels.SERIAL_LABEL}</label>
          <input
            type="text"
            value={item.serialNumber}
            onChange={(e) => onChange({ serialNumber: e.target.value.trim() })}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="צ-12345"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">
          {labels.CATALOG_LABEL} <span className="text-neutral-400">({labels.CATALOG_OPTIONAL})</span>
        </label>
        <input
          type="text"
          value={item.catalogNumber}
          onChange={(e) => onChange({ catalogNumber: e.target.value.trim() })}
          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">
          {labels.PHOTO_LABEL} <span className="text-danger-600">*</span>
        </label>
        {previewUrl ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="w-full aspect-[3/4] rounded-lg object-cover bg-neutral-100" />
            {!photoFromDraft && (
              <button type="button" onClick={handleRetake} className="btn-secondary w-full text-xs">
                {TEXT_CONSTANTS.CAMERA.RETAKE}
              </button>
            )}
          </div>
        ) : (
          <CameraCapture onCapture={handleCapture} autoStart={false} />
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">{labels.LOCATION_LABEL}</label>
        <input
          type="text"
          value={item.location}
          onChange={(e) => onChange({ location: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">{labels.NOTES_LABEL}</label>
        <textarea
          value={item.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );
}
