'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import TemplateForm, { TemplateFormValues } from './TemplateForm';
import { proposeTemplate } from '@/lib/templateRequestService';
import { useAuth } from '@/contexts/AuthContext';
import { TemplateStatus } from '@/types/equipment';
import { UserType } from '@/types/user';

export interface RequestNewTemplateFlowProps {
  capturedSerialNumber?: string;
  capturedPhotoUrl?: string;
  capturedCatalogNumber?: string;
  capturedNotes?: string;
  onCancel?: () => void;
  onSubmitted?: (result: { templateId: string; draftId?: string; status: TemplateStatus }) => void;
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
  const [submittedStatus, setSubmittedStatus] = useState<TemplateStatus | null>(null);

  const handleSubmit = async (values: TemplateFormValues) => {
    if (!enhancedUser || !enhancedUser.userType) {
      setError('משתמש לא מחובר');
      return;
    }
    setError(null);
    setSubmitting(true);
    const proposerUserName =
      enhancedUser.displayName ||
      [enhancedUser.firstName, enhancedUser.lastName].filter(Boolean).join(' ') ||
      enhancedUser.uid;

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
        proposerUserName,
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
      setSubmittedStatus(result.status);
      onSubmitted?.(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שליחת הבקשה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedStatus) {
    const isCanonical = submittedStatus === TemplateStatus.CANONICAL;
    return (
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 mx-auto bg-success-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {isCanonical ? 'התבנית נוצרה' : 'הבקשה נשלחה'}
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            {isCanonical
              ? 'התבנית זמינה לשימוש מיידי. ניתן להמשיך בהוספת הציוד.'
              : 'ההצעה נשלחה לבדיקה. תקבל התראה כאשר היא תאושר ותוכל להשלים את ההרשמה לציוד.'}
          </p>
        </div>
      </div>
    );
  }

  const isReviewer =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER;
  return (
    <div className="space-y-4">
      <div className="bg-info-50 border border-info-200 rounded-lg p-3 text-sm text-info-800">
        {isReviewer
          ? 'מילוי הטופס יוצר תבנית חדשה זמינה מיידית.'
          : 'מילוי הטופס יוצר בקשה לתבנית חדשה. לאחר אישור על ידי המנהל תוכל להשלים את הוספת הציוד.'}
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
