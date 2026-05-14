'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Pencil, Save, X, AlertCircle, Tags } from 'lucide-react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { CategoriesService, type Category } from '@/lib/categoriesService';

type EditableTarget =
  | { kind: 'category'; id: string }
  | { kind: 'subcategory'; id: string };
type EditTarget = EditableTarget | null;

export default function CategoriesTab() {
  const { enhancedUser } = useAuth();
  const canEdit =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditTarget>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await CategoriesService.getCategories({ activeOnly: false });
      if (result.success) {
        setCategories(result.categories ?? []);
      } else {
        setError(result.error || 'שגיאה בטעינת קטגוריות');
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

  const startEdit = (target: EditableTarget, currentName: string) => {
    setEdit(target);
    setDraft(currentName);
  };

  const cancelEdit = () => {
    if (saving) return;
    setEdit(null);
    setDraft('');
  };

  const showToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 2500);
  };

  const commitEdit = async () => {
    if (!edit) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      showToast('error', 'יש להזין שם');
      return;
    }
    setSaving(true);
    try {
      const result =
        edit.kind === 'category'
          ? await CategoriesService.updateCategory(edit.id, { name: trimmed })
          : await CategoriesService.updateSubcategory(edit.id, { name: trimmed });
      if (result.success) {
        showToast('success', 'השם עודכן');
        setEdit(null);
        setDraft('');
        await refresh();
      } else {
        showToast('error', result.error || 'עדכון נכשל');
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'עדכון נכשל');
    } finally {
      setSaving(false);
    }
  };

  const renderName = (
    target: EditableTarget,
    name: string,
    isActive: boolean,
  ) => {
    const isEditing = !!edit && edit.kind === target.kind && edit.id === target.id;
    if (!isEditing) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'truncate text-sm',
              isActive ? 'text-neutral-900' : 'text-neutral-400 line-through',
            )}
            title={name}
          >
            {name}
          </span>
          {!isActive && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
              לא פעיל
            </span>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startEdit(target, name);
              }}
              className="ms-1 p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
              aria-label="שנה שם"
              title="שנה שם"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitEdit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancelEdit();
            }
          }}
          disabled={saving}
          className="flex-1 min-w-0 px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="button"
          onClick={commitEdit}
          disabled={saving}
          className="p-1.5 rounded bg-primary-600 hover:bg-primary-700 text-white disabled:bg-neutral-300"
          aria-label="שמור"
          title="שמור"
        >
          <Save className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          disabled={saving}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-600"
          aria-label="ביטול"
          title="ביטול"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tags className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-neutral-900">קטגוריות ותתי-קטגוריות</h3>
      </div>
      <p className="text-sm text-neutral-600">
        ערוך את שמות הקטגוריות והתתי-קטגוריות. השם מעודכן בכל המקומות שבהם המזהה משמש (תבניות ציוד, פילטרים, ועוד).
      </p>

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
      ) : categories.length === 0 ? (
        <Card padding="lg" className="text-center text-sm text-neutral-500">
          אין קטגוריות להצגה
        </Card>
      ) : (
        <Card padding="sm" className="overflow-hidden">
          <ul className="divide-y divide-neutral-200">
            {categories.map((cat) => (
              <Disclosure key={cat.id} as="li">
                {({ open }) => (
                  <>
                    <div className="flex items-center gap-2 px-4 py-3 hover:bg-neutral-50">
                      <DisclosureButton
                        className="flex items-center gap-2 shrink-0 p-1 rounded hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        aria-label={open ? 'סגור' : 'פתח'}
                      >
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-neutral-500 transition-transform',
                            open && 'rotate-180',
                          )}
                          aria-hidden="true"
                        />
                      </DisclosureButton>
                      <div className="flex-1 min-w-0">
                        {renderName({ kind: 'category', id: cat.id }, cat.name, cat.isActive)}
                      </div>
                      <span className="text-xs text-neutral-500 shrink-0">
                        ({cat.subcategories?.length ?? 0})
                      </span>
                    </div>
                    <DisclosurePanel as="ul" className="bg-neutral-50/60 border-t border-neutral-200">
                      {(cat.subcategories ?? []).length === 0 ? (
                        <li className="px-10 py-3 text-xs text-neutral-500">אין תתי-קטגוריות</li>
                      ) : (
                        (cat.subcategories ?? []).map((sub) => (
                          <li
                            key={sub.id}
                            className="flex items-center gap-2 px-10 py-2 border-b border-neutral-100 last:border-b-0"
                          >
                            {renderName({ kind: 'subcategory', id: sub.id }, sub.name, sub.isActive)}
                          </li>
                        ))
                      )}
                    </DisclosurePanel>
                  </>
                )}
              </Disclosure>
            ))}
          </ul>
        </Card>
      )}

      {toast && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm z-50',
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
