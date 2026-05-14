'use client';

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Select } from '@/components/ui';
import { createLogisticsItem } from '@/lib/logistics/itemsRepository';
import type { LogisticsTemplate } from '@/types/logistics';

interface Props {
  templates: LogisticsTemplate[];
  onClose: () => void;
  onCreated: () => void;
  onError: (message: string) => void;
}

export default function AddLogisticsItemModal({ templates, onClose, onCreated, onError }: Props) {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [location, setLocation] = useState('');
  const [holderName, setHolderName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: t.category ? `${t.name} — ${t.category}` : t.name,
  }));

  const handleSubmit = async () => {
    if (!templateId) {
      onError('יש לבחור תבנית');
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 0) {
      onError('כמות חייבת להיות מספר חיובי');
      return;
    }
    setSubmitting(true);
    try {
      await createLogisticsItem({
        templateId,
        quantity: qty,
        location: location.trim() || undefined,
        currentHolderName: holderName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onCreated();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'יצירה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">פריט חדש</h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-neutral-400 hover:text-neutral-600"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-1">תבנית *</span>
            <Select
              value={templateId}
              onChange={(v) => setTemplateId(v === null ? null : (v as string))}
              options={templateOptions}
              placeholder="בחר תבנית"
              clearable
              ariaLabel="תבנית פריט"
            />
          </div>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">כמות *</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">מיקום</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="אופציונלי"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">מחזיק</span>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="אופציונלי"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">הערות</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="אופציונלי"
            />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-neutral-200 bg-neutral-50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:bg-neutral-300"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}
