'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import TemplateForm, { TemplateFormValues } from './TemplateForm';
import { proposeTemplate } from '@/lib/templateRequestService';
import { useAuth } from '@/contexts/AuthContext';
import type { ApiActor } from '@/lib/equipmentService';

export interface RequestNewTemplateFlowProps {
  capturedSerialNumber?: string;
  capturedPhotoUrl?: string;
  capturedCatalogNumber?: string;
  capturedNotes?: string;
  onCancel?: () => void;
  onSubmitted?: (result: { templateId: string; draftId?: string }) => void;
}

export default function RequestNewTemplateFlow({
  capturedSerialNumber,
  capturedPhotoUrl,
  capturedCatalogNumber,
  capturedNotes,
  onCancel,
  onSubmitted,
}: RequestNewTemplateFlowProps) {
  const { enhancedUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedTemplateId, setSubmittedTemplateId] = useState<string | null>(null);

  const handleSubmit = async (values: TemplateFormValues) => {
    if (!enhancedUser || !enhancedUser.userType) {
      setError('משתמש לא מחובר');
      return;
    }
    setError(null);
    setSubmitting(true);
    const actor: ApiActor = {
      uid: enhancedUser.uid,
      userType: enhancedUser.userType,
      teamId: enhancedUser.teamId,
      displayName:
        enhancedUser.displayName ||
        [enhancedUser.firstName, enhancedUser.lastName].filter(Boolean).join(' ') ||
        undefined,
    };

    try {
      const draftPayload =
        capturedSerialNumber || capturedPhotoUrl || capturedCatalogNumber || capturedNotes
          ? {
              serialNumber: capturedSerialNumber,
              photoUrl: capturedPhotoUrl,
              catalogNumber: capturedCatalogNumber || values.defaultCatalogNumber || undefined,
              notes: capturedNotes,
            }
          : undefined;

      const result = await proposeTemplate({
        actor,
        proposerUserName: actor.displayName || enhancedUser.uid,
        name: values.name,
        category: values.category,
        subcategory: values.subcategory,
        requiresSerialNumber: values.requiresSerialNumber,
        requiresDailyStatusCheck: values.requiresDailyStatusCheck,
        defaultCatalogNumber: values.defaultCatalogNumber || undefined,
        description: values.description || undefined,
        notes: values.notes || undefined,
        draftPayload,
      });
      setSubmittedTemplateId(result.templateId);
      onSubmitted?.(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שליחת הבקשה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedTemplateId) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 mx-auto bg-success-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">הבקשה נשלחה</h3>
          <p className="text-sm text-neutral-600 mt-1">
            ההצעה נשלחה לבדיקה. תקבל התראה כאשר היא תאושר ותוכל להשלים את ההרשמה לציוד.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-info-50 border border-info-200 rounded-lg p-3 text-sm text-info-800">
        מילוי הטופס יוצר בקשה לתבנית חדשה. לאחר אישור על ידי המנהל תוכל להשלים את הוספת הציוד.
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger-600" />
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      <TemplateForm
        mode="request"
        initialValues={{
          defaultCatalogNumber: capturedCatalogNumber || '',
          notes: capturedNotes || '',
        }}
        submitLabel="שלח בקשה"
        onSubmit={handleSubmit}
        onCancel={onCancel}
        isSubmitting={submitting}
      />
    </div>
  );
}
