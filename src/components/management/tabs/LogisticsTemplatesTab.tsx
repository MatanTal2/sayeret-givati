'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, AlertCircle, Boxes, Save } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import type { LogisticsTemplate } from '@/types/logistics';
import {
  listLogisticsTemplates,
  createLogisticsTemplate,
  updateLogisticsTemplate,
  deactivateLogisticsTemplate,
} from '@/lib/logistics/templatesRepository';

type FormValues = {
  name: string;
  category: string;
  subcategory: string;
  notes: string;
};

const EMPTY_FORM: FormValues = { name: '', category: '', subcategory: '', notes: '' };

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; template: LogisticsTemplate }
  | { kind: 'deactivate'; template: LogisticsTemplate };

export default function LogisticsTemplatesTab() {
  const { enhancedUser } = useAuth();
  const canEdit =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER;

  const [templates, setTemplates] = useState<LogisticsTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await listLogisticsTemplates();
      setTemplates(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const showToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 2500);
  };

  const grouped = useMemo(() => {
    const buckets = new Map<string, LogisticsTemplate[]>();
    for (const t of templates) {
      const key = t.category || 'ללא קטגוריה';
      const arr = buckets.get(key);
      if (arr) arr.push(t);
      else buckets.set(key, [t]);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'he'))
      .map(([cat, items]) => ({ cat, items: items.sort((a, b) => a.name.localeCompare(b.name, 'he')) }));
  }, [templates]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialog({ kind: 'create' });
  };

  const openEdit = (t: LogisticsTemplate) => {
    setForm({
      name: t.name,
      category: t.category,
      subcategory: t.subcategory ?? '',
      notes: t.notes ?? '',
    });
    setDialog({ kind: 'edit', template: t });
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialog({ kind: 'closed' });
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (dialog.kind !== 'create' && dialog.kind !== 'edit') return;
    if (!form.name.trim() || !form.category.trim()) {
      showToast('error', 'שם וקטגוריה הם שדות חובה');
      return;
    }
    setSubmitting(true);
    try {
      if (dialog.kind === 'create') {
        await createLogisticsTemplate({
          name: form.name.trim(),
          category: form.category.trim(),
          subcategory: form.subcategory.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        showToast('success', 'התבנית נוצרה');
      } else {
        await updateLogisticsTemplate(dialog.template.id, {
          name: form.name.trim(),
          category: form.category.trim(),
          subcategory: form.subcategory.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        showToast('success', 'התבנית עודכנה');
      }
      setDialog({ kind: 'closed' });
      setForm(EMPTY_FORM);
      await refresh();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'הפעולה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (dialog.kind !== 'deactivate') return;
    setSubmitting(true);
    try {
      await deactivateLogisticsTemplate(dialog.template.id);
      showToast('success', 'התבנית הושבתה');
      setDialog({ kind: 'closed' });
      await refresh();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'ההשבתה נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Boxes className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-neutral-900">תבניות אפסנאות</h3>
      </div>
      <p className="text-sm text-neutral-600">
        תבניות מגדירות את קטלוג הציוד הלא-ממוספר (אפסנאות). כל פריט שנוסף ב-/logistics יורש שם וקטגוריה
        מתבנית קיימת. קטגוריות ותתי-קטגוריות הן טקסט חופשי — ייחודיות ליחידה.
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {canEdit && (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            צור תבנית
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
      ) : templates.length === 0 ? (
        <Card padding="lg" className="text-center text-sm text-neutral-500">
          אין תבניות. לחץ &quot;צור תבנית&quot; כדי להתחיל.
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <Card key={group.cat} padding="sm" className="overflow-hidden">
              <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200">
                <h4 className="text-sm font-semibold text-neutral-900">
                  {group.cat}{' '}
                  <span className="text-neutral-500 text-xs">({group.items.length})</span>
                </h4>
              </div>
              <ul className="divide-y divide-neutral-200">
                {group.items.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            'text-sm truncate',
                            t.isActive ? 'text-neutral-900' : 'text-neutral-400 line-through',
                          )}
                          title={t.name}
                        >
                          {t.name}
                        </span>
                        {t.subcategory && (
                          <span className="text-xs text-neutral-500 shrink-0">
                            ({t.subcategory})
                          </span>
                        )}
                        {!t.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 shrink-0">
                            לא פעיל
                          </span>
                        )}
                      </div>
                      {t.notes && (
                        <p className="text-xs text-neutral-500 truncate" title={t.notes}>
                          {t.notes}
                        </p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
                          aria-label="ערוך"
                          title="ערוך"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {t.isActive && (
                          <button
                            type="button"
                            onClick={() => setDialog({ kind: 'deactivate', template: t })}
                            className="p-1.5 rounded hover:bg-danger-50 text-danger-500 hover:text-danger-700"
                            aria-label="השבת"
                            title="השבת"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {(dialog.kind === 'create' || dialog.kind === 'edit') && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeDialog}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">
                {dialog.kind === 'create' ? 'תבנית חדשה' : 'עריכת תבנית'}
              </h3>
              <button
                onClick={closeDialog}
                disabled={submitting}
                className="text-neutral-400 hover:text-neutral-600"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">שם *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="לדוגמה: שק שינה"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">קטגוריה *</span>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="לדוגמה: לינה"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">תת-קטגוריה</span>
                <input
                  type="text"
                  value={form.subcategory}
                  onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="אופציונלי"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">הערות</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="אופציונלי"
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-neutral-200 bg-neutral-50">
              <button
                type="button"
                onClick={closeDialog}
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
      )}

      {dialog.kind === 'deactivate' && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeDialog}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">השבתת תבנית</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-700">
                האם להשבית את התבנית <b>{dialog.template.name}</b>? לא תוצג בבחירת פריט חדש. ניתן
                להחזיר לפעילה דרך עריכה.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-neutral-200 bg-neutral-50">
              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-danger-600 hover:bg-danger-700 text-white rounded-lg disabled:bg-neutral-300"
              >
                {submitting ? 'משבית...' : 'השבת'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm z-[60]',
            toast.kind === 'success'
              ? 'bg-success-50 border border-success-200 text-success-800'
              : 'bg-danger-50 border border-danger-200 text-danger-800',
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
