'use client';

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Equipment } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';

interface ReturnModalProps {
  equipment: Equipment;
  isHolder: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<{ success: boolean; kind?: 'immediate' | 'request'; error?: string }>;
}

export default function ReturnModal({ equipment, isHolder, onClose, onSubmit }: ReturnModalProps) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.RETURN_MODAL;
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subtitle = isHolder
    ? labels.SUBTITLE_IMMEDIATE
    : labels.SUBTITLE_REQUEST.replace('{holder}', equipment.currentHolder);

  const submitLabel = isHolder ? labels.SUBMIT_IMMEDIATE : labels.SUBMIT_REQUEST;

  const handleSubmit = async () => {
    setError(null);
    if (!reason.trim()) {
      setError(labels.REASON_REQUIRED);
      return;
    }
    setSubmitting(true);
    try {
      const result = await onSubmit(reason.trim());
      if (!result.success) {
        setError(result.error || labels.ERROR);
        return;
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between p-5 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{labels.TITLE}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">{equipment.productName} · #{equipment.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="close">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div className={`rounded-lg p-3 text-sm ${isHolder ? 'bg-warning-50 text-warning-800 border border-warning-200' : 'bg-info-50 text-info-800 border border-info-200'}`}>
            {subtitle}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.REASON_LABEL}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={labels.REASON_PLACEHOLDER}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {error && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 p-5 border-t border-neutral-200">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>
            {labels.CANCEL}
          </button>
          <button type="button" onClick={handleSubmit} className="btn-danger" disabled={submitting}>
            {submitting ? '...' : submitLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
