'use client';

import React, { useMemo, useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
  Plus,
  Upload,
  AlertCircle,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import BulkTemplateImportModal from '@/components/management/BulkTemplateImportModal';
import AssignFromCentralModal from '@/components/ammunition/AssignFromCentralModal';
import { FEATURES, TEXT_CONSTANTS } from '@/constants/text';
import { cn } from '@/lib/cn';
import { apiFetch } from '@/lib/apiFetch';
import { isBruceLike } from '@/lib/ammunition/subcategories';
import {
  CENTRAL_STOCK_CSV_HEADERS,
  CENTRAL_STOCK_CSV_SAMPLE_ROW,
  csvRowToCentralStockPayload,
  type CentralStockBulkRow,
} from '@/lib/ammunition/centralStockCsv';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/user';
import { useAmmunitionTemplates } from '@/hooks/useAmmunitionTemplates';
import { useAmmunitionInventory } from '@/hooks/useAmmunitionInventory';
import type {
  AmmunitionItem,
  AmmunitionStock,
  AmmunitionType,
} from '@/types/ammunition';

const T = FEATURES.AMMUNITION;
const UNIT_HOLDER_ID = 'main';

interface PoolRow {
  template: AmmunitionType;
  stock?: AmmunitionStock;
  serials: AmmunitionItem[];
  qtyLabel: string;
  isEmpty: boolean;
}

export default function CentralStockSection() {
  const { enhancedUser } = useAuth();
  const isAdminOrManager =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER;

  const { templates } = useAmmunitionTemplates();
  const {
    stock,
    items,
    isLoading,
    error,
    upsertStock,
    deleteStock,
    assignFromCentral,
    refresh,
  } = useAmmunitionInventory();
  const { showToast } = useToast();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<AmmunitionType | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AmmunitionStock | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const poolRows: PoolRow[] = useMemo(() => {
    const stocksByTpl = new Map<string, AmmunitionStock>();
    for (const s of stock) {
      if (s.holderType === 'UNIT' && s.holderId === UNIT_HOLDER_ID) {
        stocksByTpl.set(s.templateId, s);
      }
    }
    const itemsByTpl = new Map<string, AmmunitionItem[]>();
    for (const it of items) {
      if (
        it.currentHolderType === 'UNIT' &&
        it.currentHolderId === UNIT_HOLDER_ID &&
        it.status === 'AVAILABLE'
      ) {
        const arr = itemsByTpl.get(it.templateId) ?? [];
        arr.push(it);
        itemsByTpl.set(it.templateId, arr);
      }
    }
    const out: PoolRow[] = [];
    for (const tpl of templates) {
      const s = stocksByTpl.get(tpl.id);
      const serials = itemsByTpl.get(tpl.id) ?? [];
      let qtyLabel: string;
      let isEmpty = false;
      if (tpl.trackingMode === 'SERIAL') {
        qtyLabel = `${serials.length} פריטים`;
        isEmpty = serials.length === 0;
      } else if (isBruceLike(tpl.trackingMode)) {
        const n = s?.bruceCount ?? 0;
        qtyLabel = `${n} ברוסים`;
        isEmpty = n === 0 && !s;
      } else {
        const n = s?.quantity ?? 0;
        qtyLabel = `${n} יח׳`;
        isEmpty = n === 0 && !s;
      }
      // Hide rows that have neither stock nor serials in pool (clutter).
      if (
        tpl.trackingMode !== 'SERIAL' &&
        !s &&
        serials.length === 0
      ) {
        continue;
      }
      if (tpl.trackingMode === 'SERIAL' && serials.length === 0) {
        continue;
      }
      out.push({ template: tpl, stock: s, serials, qtyLabel, isEmpty });
    }
    out.sort((a, b) => a.template.name.localeCompare(b.template.name, 'he'));
    return out;
  }, [stock, items, templates]);

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setSubmitting(true);
    const ok = await deleteStock(pendingDelete.id);
    setSubmitting(false);
    if (ok) {
      showToast('רשומה נמחקה ממלאי המרכזי', 'success');
      setPendingDelete(null);
    } else {
      showToast('מחיקה נכשלה', 'danger');
    }
  };

  if (!isAdminOrManager) {
    return (
      <Card padding="md">
        <div className="text-sm text-neutral-600 text-center py-6">
          רק מנהלים יכולים לראות את המלאי המרכזי.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 ms-1" /> הוסף למלאי
        </Button>
        <Button variant="secondary" onClick={() => setShowBulkImport(true)}>
          <Upload className="w-4 h-4 ms-1" /> ייבא CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-500 text-center py-12">טוען...</div>
      ) : poolRows.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-10 border border-dashed border-neutral-200 rounded-lg">
          המלאי המרכזי ריק. הוסף תבניות למלאי כדי להתחיל להקצות.
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 rounded-lg">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="w-8" />
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.COL_NAME}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.COL_QTY}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">תת-קטגוריה</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">אבטחה</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600 w-[1%]">{T.COL_ACTIONS}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {poolRows.map((row) => {
                const isOpen = expanded === row.template.id;
                return (
                  <React.Fragment key={row.template.id}>
                    <tr
                      className="hover:bg-neutral-50 cursor-pointer"
                      onClick={() => toggleExpanded(row.template.id)}
                    >
                      <td className="px-2">
                        <ChevronDown
                          className={`w-4 h-4 text-neutral-400 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </td>
                      <td className="px-3 py-2 text-neutral-900">{row.template.name}</td>
                      <td className="px-3 py-2 text-neutral-700">{row.qtyLabel}</td>
                      <td className="px-3 py-2 text-neutral-700">
                        {T.SUBCATEGORIES[row.template.subcategory]}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.template.securityLevel === 'EXPLOSIVE'
                              ? 'bg-danger-100 text-danger-800'
                              : 'bg-warning-100 text-warning-800'
                          }`}
                        >
                          {T.SECURITY_LEVEL[row.template.securityLevel]}
                        </span>
                      </td>
                      <td
                        className="px-3 py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PoolRowActions
                          onAssign={() => setAssignTarget(row.template)}
                          onDelete={
                            row.stock && row.template.trackingMode !== 'SERIAL' && row.isEmpty
                              ? () => setPendingDelete(row.stock!)
                              : undefined
                          }
                        />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-neutral-50/60">
                        <td colSpan={6} className="px-6 py-3">
                          <PoolRowExpanded row={row} />
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

      {assignTarget && (
        <AssignFromCentralModal
          template={assignTarget}
          unitStock={
            stock.find(
              (s) =>
                s.holderType === 'UNIT' &&
                s.holderId === UNIT_HOLDER_ID &&
                s.templateId === assignTarget.id
            ) ?? null
          }
          unitItems={items.filter(
            (i) =>
              i.currentHolderType === 'UNIT' &&
              i.currentHolderId === UNIT_HOLDER_ID &&
              i.templateId === assignTarget.id
          )}
          onClose={() => setAssignTarget(null)}
          onSubmit={async (payload) => {
            const ok = await assignFromCentral(payload);
            if (ok) showToast('ההקצאה הושלמה', 'success');
            return ok;
          }}
        />
      )}

      {showAdd && (
        <DirectAddToPoolModal
          templates={templates}
          onClose={() => setShowAdd(false)}
          onSubmit={async (payload) => {
            const ok = await upsertStock({
              templateId: payload.templateId,
              holderType: 'UNIT',
              holderId: UNIT_HOLDER_ID,
              ...(payload.bruceCount !== undefined ? { bruceCount: payload.bruceCount } : {}),
              ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
            });
            if (ok) showToast('נוסף למלאי המרכזי', 'success');
            else showToast('הוספה נכשלה', 'danger');
            return ok;
          }}
        />
      )}

      {showBulkImport && (
        <BulkTemplateImportModal<CentralStockBulkRow>
          title="ייבוא מלאי מרכזי מ-CSV"
          csvHeaders={CENTRAL_STOCK_CSV_HEADERS}
          csvSampleRow={CENTRAL_STOCK_CSV_SAMPLE_ROW}
          csvFileName="central-stock-template.csv"
          mapRow={csvRowToCentralStockPayload}
          onClose={() => {
            setShowBulkImport(false);
            refresh();
          }}
          onSubmit={async (rows) => {
            const res = await apiFetch('/api/ammunition-inventory', {
              method: 'POST',
              body: JSON.stringify({ action: 'central_bulk_load', rows }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
              throw new Error(json.error || 'ייבוא נכשל');
            }
            await refresh();
            return {
              created: json.loaded ?? 0,
              errors: json.errors ?? [],
            };
          }}
        />
      )}

      <ConfirmationModal
        isOpen={!!pendingDelete}
        title="מחיקת רשומת מלאי"
        message={
          pendingDelete
            ? 'למחוק את הרשומה? אפשר רק כאשר היתרה היא 0.'
            : ''
        }
        confirmText={TEXT_CONSTANTS.BUTTONS.DELETE}
        cancelText={TEXT_CONSTANTS.BUTTONS.CANCEL}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
        isLoading={submitting}
        variant="danger"
        useHomePageStyle
      />
    </div>
  );
}

function PoolRowExpanded({ row }: { row: PoolRow }) {
  const { template, stock, serials } = row;
  const meta: Array<{ label: string; value: React.ReactNode }> = [
    { label: T.TEMPLATE_FORM.TRACKING_MODE, value: T.TRACKING_MODE[template.trackingMode] },
    { label: T.TEMPLATE_FORM.ALLOCATION, value: T.ALLOCATION[template.allocation] },
  ];
  if (template.trackingMode === 'BRUCE') {
    meta.push(
      { label: T.TEMPLATE_FORM.CARDBOARDS_PER_BRUCE, value: template.cardboardsPerBruce ?? '—' },
      { label: T.TEMPLATE_FORM.BULLETS_PER_CARDBOARD, value: template.bulletsPerCardboard ?? '—' }
    );
  }
  if (template.trackingMode === 'BELT') {
    meta.push(
      { label: T.TEMPLATE_FORM.STRINGS_PER_BRUCE, value: template.stringsPerBruce ?? '—' },
      { label: T.TEMPLATE_FORM.BULLETS_PER_STRING, value: template.bulletsPerString ?? '—' }
    );
  }
  if (isBruceLike(template.trackingMode) && stock?.bruceCount !== undefined) {
    meta.push({ label: 'יתרת ברוסים', value: stock.bruceCount });
  }
  if (template.trackingMode === 'LOOSE_COUNT' && stock?.quantity !== undefined) {
    meta.push({ label: 'יתרה', value: stock.quantity });
  }
  return (
    <div className="space-y-2 text-xs">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {meta.map((r, i) => (
          <div key={i} className="flex gap-2">
            <dt className="text-neutral-500 min-w-32">{r.label}:</dt>
            <dd className="text-neutral-800">{r.value}</dd>
          </div>
        ))}
      </dl>
      {template.trackingMode === 'SERIAL' && serials.length > 0 && (
        <div>
          <div className="text-neutral-500 mb-1">סריאלים במלאי:</div>
          <div className="flex flex-wrap gap-1">
            {serials.map((it) => (
              <span
                key={it.id}
                className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-800"
              >
                צ-{it.id}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PoolRowActions({
  onAssign,
  onDelete,
}: {
  onAssign: () => void;
  onDelete?: () => void;
}) {
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
        className="w-44 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50 focus:outline-none"
      >
        <MenuItem>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAssign();
            }}
            className={cn(
              'w-full text-start px-3 py-2 text-sm text-neutral-700',
              'data-[focus]:bg-neutral-50'
            )}
          >
            הקצה
          </button>
        </MenuItem>
        {onDelete && (
          <>
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
                מחק רשומה ריקה
              </button>
            </MenuItem>
          </>
        )}
      </MenuItems>
    </Menu>
  );
}

interface DirectAddPayload {
  templateId: string;
  bruceCount?: number;
  quantity?: number;
}

interface DirectAddToPoolModalProps {
  templates: AmmunitionType[];
  onClose: () => void;
  onSubmit: (payload: DirectAddPayload) => Promise<boolean>;
}

function DirectAddToPoolModal({ templates, onClose, onSubmit }: DirectAddToPoolModalProps) {
  const eligible = useMemo(
    () => templates.filter((t) => t.trackingMode !== 'SERIAL'),
    [templates]
  );
  const [templateId, setTemplateId] = useState(eligible[0]?.id ?? '');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const template = eligible.find((t) => t.id === templateId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!template) {
      setError('יש לבחור תבנית');
      return;
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      setError('כמות חייבת להיות חיובית');
      return;
    }
    setSubmitting(true);
    const ok = await onSubmit({
      templateId: template.id,
      ...(isBruceLike(template.trackingMode) ? { bruceCount: n } : { quantity: n }),
    });
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-40 bg-neutral-900/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-3">הוסף למלאי המרכזי</h3>
        <form className="space-y-3" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">תבנית</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {eligible.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {T.TRACKING_MODE[t.trackingMode]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-neutral-500">
              SERIAL לא נתמך בהוספה ידנית — צרו פריט סריאלי דרך &quot;מלאי&quot; (תפקיד מנהל).
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {template && isBruceLike(template.trackingMode) ? 'כמות ברוסים להוסיף' : 'כמות להוסיף'}
            </label>
            <input
              type="number"
              min={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              ביטול
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'שומר...' : 'הוסף'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
