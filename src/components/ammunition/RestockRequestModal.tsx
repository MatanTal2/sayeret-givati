'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import type { AmmunitionType } from '@/types/ammunition';
import type { TrainingPlan } from '@/types/training';

const TT = FEATURES.AMMUNITION.TRAINING;

export interface RestockRequestModalProps {
  template: AmmunitionType;
  shortfallQty: number;
  plans: TrainingPlan[];
  onClose: () => void;
  onSubmit: (
    planId: string,
    payload: { templateId: string; templateName: string; shortfallQty: number; note?: string }
  ) => Promise<boolean>;
}

export default function RestockRequestModal({
  template,
  shortfallQty,
  plans,
  onClose,
  onSubmit,
}: RestockRequestModalProps) {
  const [planId, setPlanId] = useState<string>(plans[0]?.id ?? '');
  const [qtyText, setQtyText] = useState<string>(String(shortfallQty));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planOptions = plans.map((p) => ({
    value: p.id,
    label: `${p.teamId} · ${p.rangeLocation}`,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!planId) {
      setError(TT.RESTOCK_NO_PLAN);
      return;
    }
    const qty = Number(qtyText);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError(TT.RESTOCK_QTY_INVALID);
      return;
    }
    setSubmitting(true);
    try {
      const ok = await onSubmit(planId, {
        templateId: template.id,
        templateName: template.name,
        shortfallQty: qty,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      if (ok) onClose();
      else setError(TT.RESTOCK_FAILED);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">{TT.RESTOCK_TITLE}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100"
            aria-label="close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.RESTOCK_TEMPLATE}</label>
            <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800">
              {template.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.RESTOCK_PLAN}</label>
            {planOptions.length === 0 ? (
              <div className="text-sm text-neutral-500">{TT.RESTOCK_NO_PLAN}</div>
            ) : (
              <Select
                value={planId || null}
                onChange={(v) => setPlanId(v ?? '')}
                options={planOptions}
                placeholder="בחר תכנון"
                ariaLabel={TT.RESTOCK_PLAN}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.RESTOCK_QTY}</label>
            <input
              type="number"
              min={1}
              value={qtyText}
              onChange={(e) => setQtyText(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.RESTOCK_NOTE}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              ביטול
            </Button>
            <Button type="submit" disabled={submitting || planOptions.length === 0}>
              {submitting ? 'שולח...' : TT.RESTOCK_SUBMIT}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
