'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import { AMMUNITION_SUBCATEGORIES } from '@/lib/ammunition/subcategories';
import type {
  AmmunitionAllocation,
  AmmunitionSubcategory,
  AmmunitionTemplateStatus,
  AmmunitionType,
  SecurityLevel,
  TrackingMode,
} from '@/types/ammunition';

const T = FEATURES.AMMUNITION;

export interface AmmunitionTemplateFormValues {
  name: string;
  description: string;
  subcategory: AmmunitionSubcategory;
  allocation: AmmunitionAllocation;
  trackingMode: TrackingMode;
  securityLevel: SecurityLevel;
  bulletsPerCardboard: string;
  cardboardsPerBruce: string;
}

const EMPTY: AmmunitionTemplateFormValues = {
  name: '',
  description: '',
  subcategory: 'BULLETS',
  allocation: 'TEAM',
  trackingMode: 'BRUCE',
  securityLevel: 'EXPLOSIVE',
  bulletsPerCardboard: '30',
  cardboardsPerBruce: '33',
};

export type AmmunitionTemplateFormMode = 'create' | 'edit';

export interface AmmunitionTemplateFormProps {
  mode: AmmunitionTemplateFormMode;
  initial?: AmmunitionType;
  status?: AmmunitionTemplateStatus;
  isSubmitting?: boolean;
  onSubmit: (
    values: AmmunitionTemplateFormValues,
    status: AmmunitionTemplateStatus
  ) => Promise<void> | void;
  onCancel?: () => void;
}

function fromTemplate(t: AmmunitionType): AmmunitionTemplateFormValues {
  return {
    name: t.name,
    description: t.description || '',
    subcategory: t.subcategory,
    allocation: t.allocation,
    trackingMode: t.trackingMode,
    securityLevel: t.securityLevel,
    bulletsPerCardboard: t.bulletsPerCardboard?.toString() || '',
    cardboardsPerBruce: t.cardboardsPerBruce?.toString() || '',
  };
}

export default function AmmunitionTemplateForm({
  mode,
  initial,
  status = 'CANONICAL',
  isSubmitting = false,
  onSubmit,
  onCancel,
}: AmmunitionTemplateFormProps) {
  const [values, setValues] = useState<AmmunitionTemplateFormValues>(() =>
    initial ? fromTemplate(initial) : EMPTY
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(initial ? fromTemplate(initial) : EMPTY);
  }, [initial]);

  const set = <K extends keyof AmmunitionTemplateFormValues>(
    k: K,
    v: AmmunitionTemplateFormValues[K]
  ) => setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values.name.trim().length < 2) {
      setError('שם חייב להכיל לפחות 2 תווים');
      return;
    }
    if (values.trackingMode === 'BRUCE') {
      const bpc = Number(values.bulletsPerCardboard);
      const cpb = Number(values.cardboardsPerBruce);
      if (!Number.isFinite(bpc) || bpc <= 0) {
        setError('יש להזין מספר חיובי של כדורים בקרטג\'');
        return;
      }
      if (!Number.isFinite(cpb) || cpb <= 0) {
        setError('יש להזין מספר חיובי של קרטג\'ים בברוס');
        return;
      }
    }
    setError(null);
    await onSubmit(values, status);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {T.TEMPLATE_FORM.NAME}
        </label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {T.TEMPLATE_FORM.SUBCATEGORY}
          </label>
          <select
            value={values.subcategory}
            onChange={(e) => set('subcategory', e.target.value as AmmunitionSubcategory)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {AMMUNITION_SUBCATEGORIES.map((s) => (
              <option key={s} value={s}>
                {T.SUBCATEGORIES[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {T.TEMPLATE_FORM.ALLOCATION}
          </label>
          <select
            value={values.allocation}
            onChange={(e) => set('allocation', e.target.value as AmmunitionAllocation)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="USER">{T.ALLOCATION.USER}</option>
            <option value="TEAM">{T.ALLOCATION.TEAM}</option>
            <option value="BOTH">{T.ALLOCATION.BOTH}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {T.TEMPLATE_FORM.TRACKING_MODE}
          </label>
          <select
            value={values.trackingMode}
            onChange={(e) => set('trackingMode', e.target.value as TrackingMode)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="BRUCE">{T.TRACKING_MODE.BRUCE}</option>
            <option value="SERIAL">{T.TRACKING_MODE.SERIAL}</option>
            <option value="LOOSE_COUNT">{T.TRACKING_MODE.LOOSE_COUNT}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {T.TEMPLATE_FORM.SECURITY_LEVEL}
          </label>
          <select
            value={values.securityLevel}
            onChange={(e) => set('securityLevel', e.target.value as SecurityLevel)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="EXPLOSIVE">{T.SECURITY_LEVEL.EXPLOSIVE}</option>
            <option value="GRABBABLE">{T.SECURITY_LEVEL.GRABBABLE}</option>
          </select>
        </div>
      </div>

      {values.trackingMode === 'BRUCE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {T.TEMPLATE_FORM.BULLETS_PER_CARDBOARD}
            </label>
            <input
              type="number"
              min={1}
              value={values.bulletsPerCardboard}
              onChange={(e) => set('bulletsPerCardboard', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {T.TEMPLATE_FORM.CARDBOARDS_PER_BRUCE}
            </label>
            <input
              type="number"
              min={1}
              value={values.cardboardsPerBruce}
              onChange={(e) => set('cardboardsPerBruce', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {T.TEMPLATE_FORM.DESCRIPTION}
        </label>
        <textarea
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
            ביטול
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'שומר...' : mode === 'create' ? 'צור תבנית' : 'עדכן תבנית'}
        </Button>
      </div>
    </form>
  );
}
