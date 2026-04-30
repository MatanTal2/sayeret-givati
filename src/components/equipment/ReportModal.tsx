'use client';

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Equipment } from '@/types/equipment';
import type { EnhancedAuthUser } from '@/types/user';
import { TEXT_CONSTANTS } from '@/constants/text';
import { canReportWithoutPhoto } from '@/lib/equipmentPolicy';
import { uploadEquipmentPhoto } from '@/lib/storageService';
import CameraCapture from '@/components/camera/CameraCapture';
import { equipmentSerialDisplay } from '@/utils/equipmentDisplay';

interface ReportModalProps {
  equipment: Equipment;
  user: EnhancedAuthUser;
  onClose: () => void;
  onSubmit: (photoUrl: string | null, note: string) => Promise<{ success: boolean; error?: string }>;
}

export default function ReportModal({ equipment, user, onClose, onSubmit }: ReportModalProps) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.REPORT_MODAL;
  const allowBypass = canReportWithoutPhoto(user);
  const [bypassPhoto, setBypassPhoto] = useState(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = (blob: Blob) => {
    setPhotoBlob(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!bypassPhoto && !photoBlob) {
      setError(TEXT_CONSTANTS.FEATURES.EQUIPMENT.WIZARD.PHOTO_REQUIRED_ERROR);
      return;
    }
    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (!bypassPhoto && photoBlob) {
        const upload = await uploadEquipmentPhoto(photoBlob, equipment.id, 'report');
        photoUrl = upload.url;
      }
      const result = await onSubmit(photoUrl, note);
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between p-5 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{labels.TITLE}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {equipment.productName}
              {(() => {
                const s = equipmentSerialDisplay(equipment);
                return s ? ` · צ: ${s}` : '';
              })()}
            </p>
            <p className="text-xs text-neutral-500 mt-2">{labels.SUBTITLE}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="close">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {!bypassPhoto && (
            <div>
              {previewUrl ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="" className="w-full aspect-square rounded-lg object-cover bg-neutral-100" />
                  <button
                    type="button"
                    onClick={() => { setPhotoBlob(null); URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
                    className="btn-secondary w-full"
                  >
                    {TEXT_CONSTANTS.CAMERA.RETAKE}
                  </button>
                </div>
              ) : (
                <CameraCapture onCapture={handleCapture} />
              )}
            </div>
          )}

          {allowBypass && (
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={bypassPhoto}
                onChange={(e) => setBypassPhoto(e.target.checked)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              {labels.BYPASS_PHOTO}
            </label>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{labels.NOTE_LABEL}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={labels.NOTE_PLACEHOLDER}
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
          <button type="button" onClick={handleSubmit} className="btn-primary" disabled={submitting}>
            {submitting ? '...' : labels.SUBMIT}
          </button>
        </footer>
      </div>
    </div>
  );
}
