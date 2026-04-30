'use client';

import React, { useMemo, useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
  Plus,
  Sparkles,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { FEATURES, TEXT_CONSTANTS } from '@/constants/text';
import { cn } from '@/lib/cn';
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
  | { kind: 'edit'; template: AmmunitionType };

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
  if (values.trackingMode === 'BELT') {
    out.bulletsPerString = Number(values.bulletsPerString);
    out.stringsPerBruce = Number(values.stringsPerBruce);
  }
  return out;
}

function totalBullets(t: AmmunitionType): number | null {
  if (t.trackingMode === 'BRUCE') {
    if (t.totalBulletsPerBruce) return t.totalBulletsPerBruce;
    if (t.bulletsPerCardboard && t.cardboardsPerBruce) {
      return t.bulletsPerCardboard * t.cardboardsPerBruce;
    }
  }
  if (t.trackingMode === 'BELT') {
    if (t.totalBulletsPerStringBruce) return t.totalBulletsPerStringBruce;
    if (t.bulletsPerString && t.stringsPerBruce) {
      return t.bulletsPerString * t.stringsPerBruce;
    }
  }
  return null;
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
  const [pendingDelete, setPendingDelete] = useState<AmmunitionType | null>(null);
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

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setSubmitting(true);
    const ok = await remove(pendingDelete.id);
    setSubmitting(false);
    if (ok) {
      setPendingDelete(null);
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
        <div className="flex items-center gap-2 flex-wrap">
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
          <TemplatesTable
            title="תבניות קנוניות"
            list={grouped.canonical}
            isAdminOrManager={isAdminOrManager}
            onEdit={(t) => setDialog({ kind: 'edit', template: t })}
            onDelete={(t) => setPendingDelete(t)}
          />
          {(grouped.proposed.length > 0 || grouped.pending.length > 0) && (
            <>
              <TemplatesTable
                title="הצעות (TL)"
                list={grouped.proposed}
                isAdminOrManager={isAdminOrManager}
                onEdit={(t) => setDialog({ kind: 'edit', template: t })}
                onDelete={(t) => setPendingDelete(t)}
              />
              <TemplatesTable
                title="בקשות משתמשים"
                list={grouped.pending}
                isAdminOrManager={isAdminOrManager}
                onEdit={(t) => setDialog({ kind: 'edit', template: t })}
                onDelete={(t) => setPendingDelete(t)}
              />
            </>
          )}
        </>
      )}

      {(dialog.kind === 'create' || dialog.kind === 'edit') && (
        <div className="fixed inset-0 z-40 bg-neutral-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
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

      <ConfirmationModal
        isOpen={!!pendingDelete}
        title="מחיקת תבנית"
        message={
          pendingDelete
            ? `למחוק את התבנית "${pendingDelete.name}"? פעולה זו לא ניתנת לביטול.`
            : ''
        }
        confirmText={TEXT_CONSTANTS.BUTTONS.DELETE}
        cancelText={TEXT_CONSTANTS.BUTTONS.CANCEL}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        isLoading={submitting}
        variant="danger"
        useHomePageStyle
      />
    </div>
  );
}

interface TemplatesTableProps {
  title: string;
  list: AmmunitionType[];
  isAdminOrManager: boolean;
  onEdit: (t: AmmunitionType) => void;
  onDelete: (t: AmmunitionType) => void;
}

function TemplatesTable({
  title,
  list,
  isAdminOrManager,
  onEdit,
  onDelete,
}: TemplatesTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-medium text-neutral-900">
          {title} ({list.length})
        </h4>
      </div>
      {list.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-6">אין תבניות</div>
      ) : (
        <div className="overflow-hidden border border-neutral-200 rounded-lg">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="w-8" />
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">שם</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">תת-קטגוריה</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">אבטחה</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600 w-[1%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {list.map((t) => {
                const isOpen = expanded === t.id;
                return (
                  <React.Fragment key={t.id}>
                    <tr
                      className="hover:bg-neutral-50 cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : t.id)}
                    >
                      <td className="px-2">
                        <ChevronDown
                          className={`w-4 h-4 text-neutral-400 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </td>
                      <td className="px-3 py-2 text-neutral-900">{t.name}</td>
                      <td className="px-3 py-2 text-neutral-700">
                        {T.SUBCATEGORIES[t.subcategory]}
                      </td>
                      <td className="px-3 py-2">
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
                      <td
                        className="px-3 py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isAdminOrManager && (
                          <TemplateRowActions
                            onEdit={() => onEdit(t)}
                            onDelete={() => onDelete(t)}
                          />
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-neutral-50/60">
                        <td colSpan={5} className="px-6 py-3">
                          <TemplateMeta template={t} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function TemplateMeta({ template: t }: { template: AmmunitionType }) {
  const total = totalBullets(t);
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: T.TEMPLATE_FORM.TRACKING_MODE, value: T.TRACKING_MODE[t.trackingMode] },
    { label: T.TEMPLATE_FORM.ALLOCATION, value: T.ALLOCATION[t.allocation] },
  ];
  if (t.trackingMode === 'BRUCE') {
    rows.push(
      {
        label: T.TEMPLATE_FORM.BULLETS_PER_CARDBOARD,
        value: t.bulletsPerCardboard ?? '—',
      },
      {
        label: T.TEMPLATE_FORM.CARDBOARDS_PER_BRUCE,
        value: t.cardboardsPerBruce ?? '—',
      },
      {
        label: 'סה"כ כדורים בברוס',
        value: total !== null ? total : '—',
      }
    );
  }
  if (t.trackingMode === 'BELT') {
    rows.push(
      {
        label: T.TEMPLATE_FORM.BULLETS_PER_STRING,
        value: t.bulletsPerString ?? '—',
      },
      {
        label: T.TEMPLATE_FORM.STRINGS_PER_BRUCE,
        value: t.stringsPerBruce ?? '—',
      },
      {
        label: 'סה"כ כדורים בברוס',
        value: total !== null ? total : '—',
      }
    );
  }
  if (t.description) {
    rows.push({ label: T.TEMPLATE_FORM.DESCRIPTION, value: t.description });
  }
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <dt className="text-neutral-500 min-w-32">{r.label}:</dt>
          <dd className="text-neutral-800">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface TemplateRowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

function TemplateRowActions({ onEdit, onDelete }: TemplateRowActionsProps) {
  return (
    <Menu as="div" className="relative inline-block">
      <MenuButton
        aria-label="עוד פעולות"
        onClick={(e) => e.stopPropagation()}
        className="p-1.5 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="w-40 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50 focus:outline-none"
      >
        <MenuItem>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className={cn(
              'w-full text-start px-3 py-2 text-sm text-neutral-700',
              'data-[focus]:bg-neutral-50'
            )}
          >
            ערוך
          </button>
        </MenuItem>
        <div className="my-1 border-t border-neutral-200" role="separator" />
        <MenuItem>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={cn(
              'w-full text-start px-3 py-2 text-sm text-danger-600',
              'data-[focus]:bg-danger-50'
            )}
          >
            מחק
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
