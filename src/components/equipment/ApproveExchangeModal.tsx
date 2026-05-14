'use client';

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Equipment } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';
import { equipmentSerialDisplay } from '@/utils/equipmentDisplay';

interface ApproveExchangeModalProps {
  equipment: Equipment;
  /** When true, this is the signer-direct path (no prior request). */
  isReplaceByAnother?: boolean;
  onClose: () => void;
  onSubmit: (newSerialNumber: string, note?: string) => Promise<{ success: boolean; error?: string }>;
}

export default function ApproveExchangeModal({
  equipment,
  isReplaceByAnother = false,
  onClose,
  onSubmit,
}: ApproveExchangeModalProps) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.EXCHANGE;
  const [serial, setSerial] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const title = isReplaceByAnother ? labels.REPLACE_TITLE : labels.APPROVE_TITLE;
  const description = isReplaceByAnother ? labels.REPLACE_DESCRIPTION : labels.APPROVE_DESCRIPTION;
  const submitLabel = isReplaceByAnother ? labels.SUBMIT_REPLACE : labels.SUBMIT_APPROVE;

  const handleSubmit = async () => {
    setError(null);
    if (!serial.trim()) {
      setError(labels.VALIDATION_SERIAL_REQUIRED);
      return;
    }
    setSubmitting(true);
    try {
      const result = await onSubmit(serial.trim(), note.trim() || undefined);
      if (!result.success) {
        setError(result.error || labels.VALIDATION_SERIAL_REQUIRED);
        return;
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {equipment.productName}
              {(() => {
                const s = equipmentSerialDisplay(equipment);
                return s ? ` · צ: ${s}` : '';
              })()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="close">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div className="rounded-lg p-3 text-sm bg-info-50 text-info-800 border border-info-200">
            {description}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.NEW_SERIAL_LABEL}</label>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder={labels.NEW_SERIAL_PLACEHOLDER}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.REASON_LABEL}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={labels.REASON_PLACEHOLDER}
              rows={2}
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
          <button type="button" onClick={handleSubmit} className="btn-primary" disabled={submitting}>
            {submitting ? '...' : submitLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
