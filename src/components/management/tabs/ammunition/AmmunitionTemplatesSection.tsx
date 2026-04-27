'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Sparkles, AlertCircle, Check, X } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import {
  useAmmunitionTemplates,
  type CreateAmmunitionTemplatePayload,
} from '@/hooks/useAmmunitionTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import AmmunitionTemplateForm, {
  type AmmunitionTemplateFormValues,
} from '@/components/ammunition/AmmunitionTemplateForm';
import type {
  AmmunitionTemplateStatus,
  AmmunitionType,
} from '@/types/ammunition';

const T = FEATURES.AMMUNITION;

type Dialog =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; template: AmmunitionType }
  | { kind: 'delete'; template: AmmunitionType };

function valuesToPayload(
  values: AmmunitionTemplateFormValues,
  status: AmmunitionTemplateStatus
): CreateAmmunitionTemplatePayload {
  const out: CreateAmmunitionTemplatePayload = {
    name: values.name.trim(),
    subcategory: values.subcategory,
    allocation: values.allocation,
    trackingMode: values.trackingMode,
    securityLevel: values.securityLevel,
    status,
  };
  if (values.description.trim()) out.description = values.description.trim();
  if (values.trackingMode === 'BRUCE') {
    out.bulletsPerCardboard = Number(values.bulletsPerCardboard);
    out.cardboardsPerBruce = Number(values.cardboardsPerBruce);
  }
  return out;
}

export default function AmmunitionTemplatesSection() {
  const { enhancedUser } = useAuth();
  const isAdminOrManager =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER;

  const { templates, isLoading, error, create, update, remove, seedCanonical } =
    useAmmunitionTemplates();
  const [dialog, setDialog] = useState<Dialog>({ kind: 'closed' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const showToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 3000);
  };

  const grouped = useMemo(() => {
    const canonical: AmmunitionType[] = [];
    const proposed: AmmunitionType[] = [];
    const pending: AmmunitionType[] = [];
    for (const t of templates) {
      if (t.status === 'CANONICAL') canonical.push(t);
      else if (t.status === 'PROPOSED') proposed.push(t);
      else pending.push(t);
    }
    canonical.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    proposed.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    pending.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    return { canonical, proposed, pending };
  }, [templates]);

  const handleCreate = async (
    values: AmmunitionTemplateFormValues,
    status: AmmunitionTemplateStatus
  ) => {
    setSubmitting(true);
    const ok = await create(valuesToPayload(values, status));
    setSubmitting(false);
    if (ok) {
      setDialog({ kind: 'closed' });
      showToast('success', 'תבנית נוצרה');
    } else {
      showToast('error', 'יצירת תבנית נכשלה');
    }
  };

  const handleUpdate = async (
    template: AmmunitionType,
    values: AmmunitionTemplateFormValues,
    status: AmmunitionTemplateStatus
  ) => {
    setSubmitting(true);
    const ok = await update(template.id, valuesToPayload(values, status));
    setSubmitting(false);
    if (ok) {
      setDialog({ kind: 'closed' });
      showToast('success', 'תבנית עודכנה');
    } else {
      showToast('error', 'עדכון תבנית נכשל');
    }
  };

  const handleDelete = async (template: AmmunitionType) => {
    setSubmitting(true);
    const ok = await remove(template.id);
    setSubmitting(false);
    if (ok) {
      setDialog({ kind: 'closed' });
      showToast('success', 'תבנית נמחקה');
    } else {
      showToast('error', 'מחיקת תבנית נכשלה');
    }
  };

  const handleSeed = async () => {
    setSubmitting(true);
    const result = await seedCanonical();
    setSubmitting(false);
    if (result) {
      showToast(
        'success',
        `נזרעו ${result.created} תבניות (${result.skipped} כבר קיימות)`
      );
    } else {
      showToast('error', 'זריעה נכשלה');
    }
  };

  const renderRow = (t: AmmunitionType) => (
    <tr key={t.id} className="hover:bg-neutral-50">
      <td className="px-4 py-2 text-sm text-neutral-900">{t.name}</td>
      <td className="px-4 py-2 text-sm text-neutral-700">
        {T.SUBCATEGORIES[t.subcategory]}
      </td>
      <td className="px-4 py-2 text-sm text-neutral-700">
        {T.TRACKING_MODE[t.trackingMode]}
      </td>
      <td className="px-4 py-2 text-sm text-neutral-700">
        {T.ALLOCATION[t.allocation]}
      </td>
      <td className="px-4 py-2 text-sm">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            t.securityLevel === 'EXPLOSIVE'
              ? 'bg-danger-100 text-danger-800'
              : 'bg-warning-100 text-warning-800'
          }`}
        >
          {T.SECURITY_LEVEL[t.securityLevel]}
        </span>
      </td>
      <td className="px-4 py-2 text-sm text-neutral-600">
        {t.trackingMode === 'BRUCE' && t.totalBulletsPerBruce
          ? `${t.bulletsPerCardboard}×${t.cardboardsPerBruce} = ${t.totalBulletsPerBruce}`
          : '—'}
      </td>
      <td className="px-4 py-2 text-sm">
        {isAdminOrManager && (
          <div className="flex items-center gap-1 justify-end">
            <button
              type="button"
              onClick={() => setDialog({ kind: 'edit', template: t })}
              className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100"
              aria-label="ערוך"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDialog({ kind: 'delete', template: t })}
              className="p-1 rounded-md text-danger-500 hover:bg-danger-50"
              aria-label="מחק"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );

  const renderTable = (title: string, list: AmmunitionType[]) => (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-medium text-neutral-900">
          {title} ({list.length})
        </h4>
      </div>
      {list.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-6">
          אין תבניות
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-right">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-xs font-medium text-neutral-600">שם</th>
                <th className="px-4 py-2 text-xs font-medium text-neutral-600">תת-קטגוריה</th>
                <th className="px-4 py-2 text-xs font-medium text-neutral-600">מעקב</th>
                <th className="px-4 py-2 text-xs font-medium text-neutral-600">הקצאה</th>
                <th className="px-4 py-2 text-xs font-medium text-neutral-600">אבטחה</th>
                <th className="px-4 py-2 text-xs font-medium text-neutral-600">ברוס</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">{list.map(renderRow)}</tbody>
          </table>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {toast && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            toast.kind === 'success'
              ? 'bg-success-50 border border-success-200 text-success-800'
              : 'bg-danger-50 border border-danger-200 text-danger-800'
          }`}
        >
          {toast.kind === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {isAdminOrManager && (
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialog({ kind: 'create' })}>
            <Plus className="w-4 h-4 ms-1" /> תבנית חדשה
          </Button>
          <Button variant="secondary" onClick={handleSeed} disabled={submitting}>
            <Sparkles className="w-4 h-4 ms-1" /> זרע תבניות קנוניות
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-neutral-500 text-center py-12">טוען...</div>
      ) : (
        <>
          {renderTable('תבניות קנוניות', grouped.canonical)}
          {(grouped.proposed.length > 0 || grouped.pending.length > 0) && (
            <>
              {renderTable('הצעות (TL)', grouped.proposed)}
              {renderTable('בקשות משתמשים', grouped.pending)}
            </>
          )}
        </>
      )}

      {/* Create / edit dialog */}
      {(dialog.kind === 'create' || dialog.kind === 'edit') && (
        <div className="fixed inset-0 z-40 bg-neutral-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                {dialog.kind === 'create' ? 'תבנית חדשה' : 'עריכת תבנית'}
              </h3>
              <button
                type="button"
                onClick={() => setDialog({ kind: 'closed' })}
                className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AmmunitionTemplateForm
              mode={dialog.kind === 'create' ? 'create' : 'edit'}
              initial={dialog.kind === 'edit' ? dialog.template : undefined}
              status={dialog.kind === 'edit' ? dialog.template.status : 'CANONICAL'}
              isSubmitting={submitting}
              onCancel={() => setDialog({ kind: 'closed' })}
              onSubmit={
                dialog.kind === 'create'
                  ? handleCreate
                  : (values, status) => handleUpdate(dialog.template, values, status)
              }
            />
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {dialog.kind === 'delete' && (
        <div className="fixed inset-0 z-40 bg-neutral-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              מחיקת תבנית
            </h3>
            <p className="text-sm text-neutral-700 mb-4">
              למחוק את התבנית &quot;{dialog.template.name}&quot;? פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialog({ kind: 'closed' })} disabled={submitting}>
                ביטול
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(dialog.template)}
                disabled={submitting}
              >
                {submitting ? 'מוחק...' : 'מחק'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
