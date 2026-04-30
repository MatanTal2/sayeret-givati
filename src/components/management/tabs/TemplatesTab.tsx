'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Plus, X, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Button, Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { EquipmentType, TemplateStatus } from '@/types/equipment';
import { EquipmentTypesService } from '@/lib/equipmentService';
import {
  approveTemplateRequest,
  proposeTemplate,
  rejectTemplateRequest,
} from '@/lib/templateRequestService';
import TemplateForm, { TemplateFormValues } from '@/components/equipment/TemplateForm';
import { useCategoryLookup } from '@/hooks/useCategoryLookup';

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create_canonical' }
  | { kind: 'propose' }
  | { kind: 'review'; template: EquipmentType }
  | { kind: 'reject'; template: EquipmentType };

export default function TemplatesTab() {
  const { enhancedUser } = useAuth();
  const isManagerOrAbove =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER;
  const isTeamLeader = enhancedUser?.userType === UserType.TEAM_LEADER;

  const { categoryName, subcategoryName } = useCategoryLookup();
  const [templates, setTemplates] = useState<EquipmentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await EquipmentTypesService.getTemplates();
      if (result.success && result.data) {
        setTemplates(result.data as EquipmentType[]);
      } else {
        setError(result.message || 'שגיאה בטעינת תבניות');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { canonical, proposed, pending } = useMemo(() => {
    const canonical: EquipmentType[] = [];
    const proposed: EquipmentType[] = [];
    const pending: EquipmentType[] = [];
    for (const t of templates) {
      switch (t.status) {
        case TemplateStatus.CANONICAL:
          canonical.push(t);
          break;
        case TemplateStatus.PROPOSED:
          proposed.push(t);
          break;
        case TemplateStatus.PENDING_REQUEST:
          pending.push(t);
          break;
      }
    }
    return { canonical, proposed, pending };
  }, [templates]);

  const showToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Submit handlers
  const handleCreateCanonical = async (values: TemplateFormValues) => {
    if (!enhancedUser) return;
    setSubmitting(true);
    try {
      const result = await EquipmentTypesService.createEquipmentType({
        name: values.name,
        description: values.description || undefined,
        category: values.category,
        subcategory: values.subcategory,
        notes: values.notes || undefined,
        requiresDailyStatusCheck: values.requiresDailyStatusCheck,
        requiresSerialNumber: values.requiresSerialNumber,
        defaultCatalogNumber: values.defaultCatalogNumber || undefined,
        isActive: true,
        templateCreatorId: enhancedUser.uid,
        status: TemplateStatus.CANONICAL,
      });
      if (result.success) {
        showToast('success', 'התבנית נוצרה');
        setDialog({ kind: 'closed' });
        await refresh();
      } else {
        showToast('error', result.message || 'יצירת תבנית נכשלה');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePropose = async (values: TemplateFormValues) => {
    if (!enhancedUser) return;
    setSubmitting(true);
    try {
      await proposeTemplate({
        proposerUserName:
          [enhancedUser.firstName, enhancedUser.lastName].filter(Boolean).join(' ') ||
          enhancedUser.uid,
        name: values.name,
        category: values.category,
        subcategory: values.subcategory,
        requiresSerialNumber: values.requiresSerialNumber,
        requiresDailyStatusCheck: values.requiresDailyStatusCheck,
        defaultCatalogNumber: values.defaultCatalogNumber || undefined,
        description: values.description || undefined,
        notes: values.notes || undefined,
      });
      showToast('success', 'ההצעה נשלחה לבדיקה');
      setDialog({ kind: 'closed' });
      await refresh();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'שליחת ההצעה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (template: EquipmentType, values: TemplateFormValues) => {
    if (!enhancedUser) return;
    setSubmitting(true);
    try {
      await approveTemplateRequest({
        templateId: template.id,
        approverUserName:
          [enhancedUser.firstName, enhancedUser.lastName].filter(Boolean).join(' ') ||
          enhancedUser.uid,
        edits: {
          name: values.name,
          category: values.category,
          subcategory: values.subcategory,
          requiresSerialNumber: values.requiresSerialNumber,
          requiresDailyStatusCheck: values.requiresDailyStatusCheck,
          defaultCatalogNumber: values.defaultCatalogNumber || '',
          description: values.description || '',
          notes: values.notes || '',
        },
      });
      showToast('success', 'התבנית אושרה');
      setDialog({ kind: 'closed' });
      await refresh();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'אישור נכשל');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (dialog.kind !== 'reject' || !enhancedUser) return;
    setSubmitting(true);
    try {
      await rejectTemplateRequest({
        templateId: dialog.template.id,
        rejectorUserName:
          [enhancedUser.firstName, enhancedUser.lastName].filter(Boolean).join(' ') ||
          enhancedUser.uid,
        reason: rejectReason.trim() || undefined,
      });
      showToast('success', 'התבנית נדחתה');
      setDialog({ kind: 'closed' });
      setRejectReason('');
      await refresh();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'דחייה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  // Render helpers
  const renderCategoryCell = (t: EquipmentType) => {
    const cat = categoryName(t.category);
    const sub = t.subcategory ? subcategoryName(t.subcategory) : null;
    const catDisplay = cat ?? (
      <span className="text-warning-700" title="קטגוריה לא נמצאה">{t.category}</span>
    );
    const subDisplay =
      t.subcategory && (
        <>
          {' / '}
          {sub ?? (
            <span className="text-warning-700" title="תת-קטגוריה לא נמצאה">{t.subcategory}</span>
          )}
        </>
      );
    return (
      <>
        {catDisplay}
        {subDisplay}
      </>
    );
  };

  const renderRow = (t: EquipmentType, actions: React.ReactNode) => (
    <Disclosure key={t.id} as="li" className="border-b border-neutral-200 last:border-b-0">
      {({ open }) => (
        <>
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
            <DisclosureButton className="flex-1 flex items-center gap-2 text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded">
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-neutral-500 transition-transform',
                  open && 'rotate-180'
                )}
              />
              <span className="text-sm font-medium text-neutral-900">{t.name}</span>
            </DisclosureButton>
            <div className="flex-shrink-0">{actions}</div>
          </div>
          <DisclosurePanel className="px-4 pb-3 pt-1 bg-neutral-50/60 text-sm text-neutral-700 space-y-1">
            <div>
              <span className="font-medium text-neutral-500">קטגוריה:</span>{' '}
              {renderCategoryCell(t)}
            </div>
            {t.description && (
              <div>
                <span className="font-medium text-neutral-500">תיאור:</span> {t.description}
              </div>
            )}
            {t.notes && (
              <div>
                <span className="font-medium text-neutral-500">הערות:</span> {t.notes}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 pt-1">
              <span>{t.requiresSerialNumber ? 'דורש מספר סידורי (צ)' : 'לא צ'}</span>
              <span>
                {t.requiresDailyStatusCheck
                  ? 'דורש בדיקת סטטוס יומי'
                  : 'לא דורש בדיקה יומית'}
              </span>
              {t.defaultCatalogNumber && <span>מק&quot;ט: {t.defaultCatalogNumber}</span>}
              <span>סטטוס: {t.status}</span>
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );

  const reviewActions = (t: EquipmentType) =>
    isManagerOrAbove ? (
      <div className="flex gap-2">
        <button
          onClick={() => setDialog({ kind: 'review', template: t })}
          className="text-primary-600 hover:text-primary-800 text-xs"
        >
          ערוך ואשר
        </button>
        <button
          onClick={() => {
            setDialog({ kind: 'reject', template: t });
            setRejectReason('');
          }}
          className="text-danger-600 hover:text-danger-800 text-xs"
        >
          דחה
        </button>
      </div>
    ) : (
      <span className="text-xs text-neutral-500">ממתין</span>
    );

  const section = (
    title: string,
    items: EquipmentType[],
    actions: (t: EquipmentType) => React.ReactNode,
    emptyMessage: string
  ) => (
    <Card padding="sm" className="overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
        <h4 className="text-md font-semibold text-neutral-900">
          {title} <span className="text-neutral-500 text-sm">({items.length})</span>
        </h4>
      </div>
      {items.length === 0 ? (
        <div className="p-6 text-center text-sm text-neutral-500">{emptyMessage}</div>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {items.map((t) => renderRow(t, actions(t)))}
        </ul>
      )}
    </Card>
  );

  // Modal wrapper
  const modal = (title: string, content: React.ReactNode) => (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => !submitting && setDialog({ kind: 'closed' })}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={() => !submitting && setDialog({ kind: 'closed' })}
            disabled={submitting}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{content}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-start gap-2 flex-wrap">
        {isManagerOrAbove && (
          <Button onClick={() => setDialog({ kind: 'create_canonical' })} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            צור תבנית קנונית
          </Button>
        )}
        {isTeamLeader && (
          <Button onClick={() => setDialog({ kind: 'propose' })} variant="secondary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            הצע תבנית
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger-600" />
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      {isLoading ? (
        <Card padding="lg" className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        </Card>
      ) : (
        <>
          {section(
            'תבניות קנוניות',
            canonical,
            () => <span className="text-xs text-neutral-500">פעיל</span>,
            'אין תבניות קנוניות'
          )}
          {section(
            'הצעות ממפקדי צוות',
            proposed,
            reviewActions,
            'אין הצעות ממתינות'
          )}
          {section(
            'בקשות מחיילים',
            pending,
            reviewActions,
            'אין בקשות ממתינות'
          )}
        </>
      )}

      {dialog.kind === 'create_canonical' &&
        modal(
          'יצירת תבנית קנונית',
          <TemplateForm
            mode="create_canonical"
            onSubmit={handleCreateCanonical}
            onCancel={() => setDialog({ kind: 'closed' })}
            isSubmitting={submitting}
          />
        )}

      {dialog.kind === 'propose' &&
        modal(
          'הצעת תבנית חדשה',
          <TemplateForm
            mode="propose"
            onSubmit={handlePropose}
            onCancel={() => setDialog({ kind: 'closed' })}
            isSubmitting={submitting}
          />
        )}

      {dialog.kind === 'review' &&
        modal(
          'עריכה ואישור תבנית',
          <TemplateForm
            mode="edit_and_approve"
            initialValues={{
              name: dialog.template.name,
              description: dialog.template.description || '',
              category: dialog.template.category,
              subcategory: dialog.template.subcategory,
              notes: dialog.template.notes || '',
              requiresSerialNumber: !!dialog.template.requiresSerialNumber,
              requiresDailyStatusCheck: !!dialog.template.requiresDailyStatusCheck,
              defaultCatalogNumber: dialog.template.defaultCatalogNumber || '',
            }}
            onSubmit={(v) => handleReview(dialog.template, v)}
            onCancel={() => setDialog({ kind: 'closed' })}
            isSubmitting={submitting}
            submitLabel="אשר תבנית"
          />
        )}

      {dialog.kind === 'reject' &&
        modal(
          'דחיית תבנית',
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">
              האם לדחות את התבנית &quot;{dialog.template.name}&quot;?
            </p>
            <div>
              <label htmlFor="reject-reason" className="block text-sm font-medium text-neutral-700 mb-1">
                סיבה (אופציונלי)
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                disabled={submitting}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDialog({ kind: 'closed' })} disabled={submitting}>
                ביטול
              </Button>
              <Button variant="danger" onClick={handleReject} isLoading={submitting} disabled={submitting}>
                דחה
              </Button>
            </div>
          </div>
        )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
            toast.kind === 'success'
              ? 'bg-success-50 border border-success-200 text-success-800'
              : 'bg-danger-50 border border-danger-200 text-danger-800'
          }`}
        >
          {toast.kind === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

      {!isManagerOrAbove && !isTeamLeader && (
        <Card padding="sm" className="bg-neutral-50">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Layers className="w-4 h-4" />
            <span>תוכל לראות את הבקשות שלך לתבניות חדשות לאחר ששלחת בקשה.</span>
          </div>
        </Card>
      )}
    </div>
  );
}
