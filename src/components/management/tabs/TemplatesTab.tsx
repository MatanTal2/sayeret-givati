'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Plus, X, Check, AlertCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { EquipmentType, TemplateStatus } from '@/types/equipment';
import { EquipmentTypesService } from '@/lib/equipmentService';
import {
  approveTemplateRequest,
  proposeTemplate,
  rejectTemplateRequest,
} from '@/lib/templateRequestService';
import type { ApiActor } from '@/lib/equipmentService';
import TemplateForm, { TemplateFormValues } from '@/components/equipment/TemplateForm';

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create_canonical' }
  | { kind: 'propose' }
  | { kind: 'review'; template: EquipmentType }
  | { kind: 'reject'; template: EquipmentType };

function buildActor(
  user: ReturnType<typeof useAuth>['enhancedUser']
): ApiActor | null {
  if (!user || !user.userType) return null;
  return {
    uid: user.uid,
    userType: user.userType,
    teamId: user.teamId,
    displayName:
      user.displayName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      undefined,
  };
}

export default function TemplatesTab() {
  const { enhancedUser } = useAuth();
  const isManagerOrAbove =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER;
  const isTeamLeader = enhancedUser?.userType === UserType.TEAM_LEADER;

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
    const actor = buildActor(enhancedUser);
    if (!actor || !enhancedUser) return;
    setSubmitting(true);
    try {
      await proposeTemplate({
        actor,
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
    const actor = buildActor(enhancedUser);
    if (!actor || !enhancedUser) return;
    setSubmitting(true);
    try {
      await approveTemplateRequest({
        actor,
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
    const actor = buildActor(enhancedUser);
    if (!actor || dialog.kind !== 'reject' || !enhancedUser) return;
    setSubmitting(true);
    try {
      await rejectTemplateRequest({
        actor,
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
  const renderRow = (t: EquipmentType, actions: React.ReactNode) => (
    <tr key={t.id} className="hover:bg-neutral-50">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-neutral-900">{t.name}</div>
        {t.description && (
          <div className="text-xs text-neutral-500">{t.description}</div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-neutral-700">
        {t.category}
        {t.subcategory ? ` / ${t.subcategory}` : ''}
      </td>
      <td className="px-4 py-3 text-sm text-neutral-600">
        {t.requiresSerialNumber ? 'צ' : '—'}
      </td>
      <td className="px-4 py-3 text-sm">{actions}</td>
    </tr>
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
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase">תבנית</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase">קטגוריה</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase">צ</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {items.map((t) => renderRow(t, actions(t)))}
            </tbody>
          </table>
        </div>
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
