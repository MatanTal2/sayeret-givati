'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FEATURES, TEXT_CONSTANTS } from '@/constants/text';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { isBruceLike } from '@/lib/ammunition/subcategories';
import AmmunitionRowActions, {
  type AmmunitionRowAction,
} from './AmmunitionRowActions';
import type {
  AmmunitionItem,
  AmmunitionItemStatus,
  AmmunitionStock,
  AmmunitionType,
  HolderType,
} from '@/types/ammunition';

const T = FEATURES.AMMUNITION;

const USED_STATUSES: AmmunitionItemStatus[] = ['CONSUMED', 'RETURNED', 'LOST', 'DAMAGED'];

export interface InventoryFilter {
  holderType?: HolderType;
  holderId?: string;
}

type Row =
  | {
      kind: 'stock';
      key: string;
      template: AmmunitionType;
      stock: AmmunitionStock;
      sortBucket: 0;
    }
  | {
      kind: 'item';
      key: string;
      template: AmmunitionType;
      item: AmmunitionItem;
      sortBucket: 0 | 1;
    };

export type AmmunitionViewMode = 'active' | 'used';

export interface AmmunitionInventoryViewProps {
  templates: AmmunitionType[];
  stock: AmmunitionStock[];
  items: AmmunitionItem[];
  filter?: InventoryFilter;
  emptyMessage?: string;
  showHolder?: boolean;
  /** 'active' (default) hides used SERIAL items; 'used' shows only used items, no BRUCE/LOOSE_COUNT stock rows. */
  viewMode?: AmmunitionViewMode;
  resolveHolderName?: (holderType: HolderType, holderId: string) => string;
  /** UI-side gate: which rows the actor can act on at all. Server re-validates. */
  canMutate?: (entry: { templateId: string; holderType: HolderType; holderId: string }) => boolean;
  /** Whether to surface a Delete button. Defaults to canMutate. */
  canDeleteRow?: (entry: { templateId: string; holderType: HolderType; holderId: string }) => boolean;
  onDeleteStock?: (stockId: string) => void;
  onDeleteItem?: (serial: string) => void;
  onTransferItem?: (item: AmmunitionItem) => void;
  onReturnItemToMgr?: (item: AmmunitionItem) => void;
  /** Optional. When provided, shows a "החזר למלאי מרכזי" kebab item on SERIAL rows. */
  onReturnItemToUnit?: (item: AmmunitionItem) => void;
  /** Whether the kebab "החזר למלאי מרכזי" entry should be visible. Page-level admin gate. */
  canReturnToUnit?: boolean;
}

function holderLabelFor(
  holderType: HolderType,
  holderId: string,
  resolveHolderName?: (ht: HolderType, hid: string) => string
): string {
  if (resolveHolderName) {
    const resolved = resolveHolderName(holderType, holderId);
    if (resolved) return resolved;
  }
  return holderId;
}

function quantityCell(stock: AmmunitionStock, template: AmmunitionType): string {
  if (isBruceLike(template.trackingMode)) {
    const open =
      stock.openBruceState && stock.openBruceState !== 'EMPTY'
        ? ` + פתוח: ${T.BRUCE_STATE[stock.openBruceState]}`
        : '';
    return `${stock.bruceCount ?? 0} ברוסים${open}`;
  }
  return `${stock.quantity ?? 0} יח׳`;
}

type PendingConfirm =
  | { kind: 'delete-stock'; stockId: string }
  | { kind: 'delete-item'; serial: string }
  | { kind: 'return-item'; serial: string }
  | { kind: 'return-item-to-unit'; serial: string };

export default function AmmunitionInventoryView({
  templates,
  stock,
  items,
  filter,
  emptyMessage,
  showHolder = false,
  viewMode = 'active',
  resolveHolderName,
  canMutate,
  canDeleteRow,
  onDeleteStock,
  onDeleteItem,
  onTransferItem,
  onReturnItemToMgr,
  onReturnItemToUnit,
  canReturnToUnit = false,
}: AmmunitionInventoryViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const toggleExpanded = (key: string) =>
    setExpanded((prev) => (prev === key ? null : key));

  const templatesById = useMemo(() => {
    const m = new Map<string, AmmunitionType>();
    templates.forEach((t) => m.set(t.id, t));
    return m;
  }, [templates]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    if (viewMode === 'active') {
      for (const s of stock) {
        if (filter?.holderType && s.holderType !== filter.holderType) continue;
        if (filter?.holderId && s.holderId !== filter.holderId) continue;
        const tpl = templatesById.get(s.templateId);
        if (!tpl) continue;
        out.push({ kind: 'stock', key: `s:${s.id}`, template: tpl, stock: s, sortBucket: 0 });
      }
    }
    for (const it of items) {
      if (filter?.holderType && it.currentHolderType !== filter.holderType) continue;
      if (filter?.holderId && it.currentHolderId !== filter.holderId) continue;
      const tpl = templatesById.get(it.templateId);
      if (!tpl) continue;
      const used = USED_STATUSES.includes(it.status);
      if (viewMode === 'active' && used) continue;
      if (viewMode === 'used' && !used) continue;
      out.push({
        kind: 'item',
        key: `i:${it.id}`,
        template: tpl,
        item: it,
        sortBucket: 0,
      });
    }
    out.sort((a, b) => {
      const c = a.template.name.localeCompare(b.template.name, 'he');
      if (c !== 0) return c;
      return a.key.localeCompare(b.key);
    });
    return out;
  }, [stock, items, filter, templatesById, viewMode]);

  if (rows.length === 0) {
    return (
      <div className="text-sm text-neutral-500 text-center py-10 border border-dashed border-neutral-200 rounded-lg">
        {emptyMessage || T.EMPTY_INVENTORY}
      </div>
    );
  }

  const handleAction = (row: Row, action: AmmunitionRowAction) => {
    if (row.kind === 'stock') {
      if (action === 'delete' && onDeleteStock) {
        setPending({ kind: 'delete-stock', stockId: row.stock.id });
      }
      return;
    }
    const it = row.item;
    if (action === 'transfer' && onTransferItem) {
      onTransferItem(it);
    } else if (action === 'return-to-mgr' && onReturnItemToMgr) {
      setPending({ kind: 'return-item', serial: it.id });
    } else if (action === 'return-to-unit' && onReturnItemToUnit) {
      setPending({ kind: 'return-item-to-unit', serial: it.id });
    } else if (action === 'delete' && onDeleteItem) {
      setPending({ kind: 'delete-item', serial: it.id });
    }
  };

  const confirmPending = () => {
    if (!pending) return;
    if (pending.kind === 'delete-stock' && onDeleteStock) onDeleteStock(pending.stockId);
    else if (pending.kind === 'delete-item' && onDeleteItem) onDeleteItem(pending.serial);
    else if (pending.kind === 'return-item' && onReturnItemToMgr) {
      const it = items.find((i) => i.id === pending.serial);
      if (it) onReturnItemToMgr(it);
    } else if (pending.kind === 'return-item-to-unit' && onReturnItemToUnit) {
      const it = items.find((i) => i.id === pending.serial);
      if (it) onReturnItemToUnit(it);
    }
    setPending(null);
  };

  const confirmCopy = pending
    ? pending.kind === 'return-item'
      ? {
          title: T.INVENTORY_ACTIONS.RETURN_TO_MGR,
          message: T.INVENTORY_ACTIONS.RETURN_CONFIRM,
          confirmText: T.INVENTORY_ACTIONS.RETURN_TO_MGR,
          variant: 'info' as const,
        }
      : pending.kind === 'return-item-to-unit'
        ? {
            title: T.INVENTORY_ACTIONS.RETURN_TO_UNIT,
            message: T.INVENTORY_ACTIONS.RETURN_TO_UNIT_CONFIRM,
            confirmText: T.INVENTORY_ACTIONS.RETURN_TO_UNIT,
            variant: 'info' as const,
          }
        : {
            title: T.INVENTORY_ACTIONS.DELETE,
            message: T.INVENTORY_ACTIONS.DELETE_CONFIRM,
            confirmText: T.INVENTORY_ACTIONS.DELETE,
            variant: 'danger' as const,
          }
    : null;

  const colCount = 4 + (showHolder ? 1 : 0) + 1; // chevron + name + qty + status + (holder?) + actions

  return (
    <>
    <div className="overflow-x-auto border border-neutral-200 rounded-lg">
      <table className="min-w-full text-right text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th className="w-8" />
            <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.COL_NAME}</th>
            <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.COL_QTY}</th>
            <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.COL_STATUS}</th>
            {showHolder && (
              <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.COL_HOLDER}</th>
            )}
            <th className="px-3 py-2 text-xs font-medium text-neutral-600 w-[1%]">
              {T.COL_ACTIONS}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => {
            const isOpen = expanded === row.key;
            if (row.kind === 'stock') {
              const { template, stock: s } = row;
              const allowDelete = canDeleteRow?.({
                templateId: template.id,
                holderType: s.holderType,
                holderId: s.holderId,
              });
              return (
                <React.Fragment key={row.key}>
                  <tr
                    className="hover:bg-neutral-50 cursor-pointer"
                    onClick={() => toggleExpanded(row.key)}
                  >
                    <td className="px-2">
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </td>
                    <td className="px-3 py-2 text-neutral-900">{template.name}</td>
                    <td className="px-3 py-2 text-neutral-700">{quantityCell(s, template)}</td>
                    <td className="px-3 py-2 text-neutral-400">—</td>
                    {showHolder && (
                      <td className="px-3 py-2 text-neutral-700 text-xs">
                        {holderLabelFor(s.holderType, s.holderId, resolveHolderName)}
                      </td>
                    )}
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <AmmunitionRowActions
                        showTransfer={false}
                        showReturn={false}
                        showDelete={!!allowDelete && !!onDeleteStock}
                        onAction={(a) => handleAction(row, a)}
                      />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-neutral-50/60">
                      <td colSpan={colCount} className="px-6 py-3">
                        <StockExpanded
                          template={template}
                          stock={s}
                          showHolder={showHolder}
                          resolveHolderName={resolveHolderName}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }
            const { template, item: it } = row;
            const isAvailable = it.status === 'AVAILABLE';
            const isConsumed = it.status === 'CONSUMED';
            const used = USED_STATUSES.includes(it.status);
            const allowMutate = canMutate?.({
              templateId: template.id,
              holderType: it.currentHolderType,
              holderId: it.currentHolderId,
            });
            const allowDelete = canDeleteRow?.({
              templateId: template.id,
              holderType: it.currentHolderType,
              holderId: it.currentHolderId,
            });
            return (
              <React.Fragment key={row.key}>
                <tr
                  className={`cursor-pointer ${
                    used ? 'bg-neutral-50/40 text-neutral-500' : 'hover:bg-neutral-50'
                  }`}
                  onClick={() => toggleExpanded(row.key)}
                >
                  <td className="px-2">
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </td>
                  <td className="px-3 py-2 text-neutral-900">{template.name}</td>
                  <td className="px-3 py-2 font-medium text-neutral-900">צ-{it.id}</td>
                  <td className="px-3 py-2 text-xs">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                        isAvailable
                          ? 'bg-success-100 text-success-800'
                          : isConsumed
                            ? 'bg-warning-100 text-warning-800'
                            : it.status === 'RETURNED'
                              ? 'bg-info-100 text-info-800'
                              : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {T.ITEM_STATUS[it.status]}
                    </span>
                  </td>
                  {showHolder && (
                    <td className="px-3 py-2 text-neutral-700 text-xs">
                      {holderLabelFor(it.currentHolderType, it.currentHolderId, resolveHolderName)}
                    </td>
                  )}
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <AmmunitionRowActions
                      showTransfer={isAvailable && !!allowMutate && !!onTransferItem}
                      showReturn={isConsumed && !!allowMutate && !!onReturnItemToMgr}
                      showReturnToUnit={
                        isAvailable &&
                        canReturnToUnit &&
                        !!onReturnItemToUnit &&
                        it.currentHolderType !== 'UNIT'
                      }
                      showDelete={isAvailable && !!allowDelete && !!onDeleteItem}
                      onAction={(a) => handleAction(row, a)}
                    />
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-neutral-50/60">
                    <td colSpan={colCount} className="px-6 py-3">
                      <ItemExpanded
                        template={template}
                        item={it}
                        showHolder={showHolder}
                        resolveHolderName={resolveHolderName}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
    {confirmCopy && (
      <ConfirmationModal
        isOpen={!!pending}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmText={confirmCopy.confirmText}
        cancelText={TEXT_CONSTANTS.BUTTONS.CANCEL}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
        variant={confirmCopy.variant}
        useHomePageStyle
      />
    )}
    </>
  );
}

interface ExpandedRowMeta {
  label: string;
  value: React.ReactNode;
}

function MetaList({ rows }: { rows: ExpandedRowMeta[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <dt className="text-neutral-500 min-w-24">{r.label}:</dt>
          <dd className="text-neutral-800">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StockExpanded({
  template,
  stock,
  showHolder,
  resolveHolderName,
}: {
  template: AmmunitionType;
  stock: AmmunitionStock;
  showHolder: boolean;
  resolveHolderName?: (ht: HolderType, hid: string) => string;
}) {
  const meta: ExpandedRowMeta[] = [
    { label: T.TEMPLATE_FORM.SUBCATEGORY, value: T.SUBCATEGORIES[template.subcategory] },
    { label: T.TEMPLATE_FORM.TRACKING_MODE, value: T.TRACKING_MODE[template.trackingMode] },
    { label: T.TEMPLATE_FORM.SECURITY_LEVEL, value: T.SECURITY_LEVEL[template.securityLevel] },
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
  if (isBruceLike(template.trackingMode)) {
    meta.push({
      label: 'מצב ברוס פתוח',
      value: stock.openBruceState ? T.BRUCE_STATE[stock.openBruceState] : '—',
    });
  }
  if (showHolder) {
    meta.push({
      label: T.COL_HOLDER,
      value: holderLabelFor(stock.holderType, stock.holderId, resolveHolderName),
    });
  }
  return <MetaList rows={meta} />;
}

function ItemExpanded({
  template,
  item,
  showHolder,
  resolveHolderName,
}: {
  template: AmmunitionType;
  item: AmmunitionItem;
  showHolder: boolean;
  resolveHolderName?: (ht: HolderType, hid: string) => string;
}) {
  const meta: ExpandedRowMeta[] = [
    { label: T.TEMPLATE_FORM.SUBCATEGORY, value: T.SUBCATEGORIES[template.subcategory] },
    { label: T.TEMPLATE_FORM.TRACKING_MODE, value: T.TRACKING_MODE[template.trackingMode] },
    { label: T.TEMPLATE_FORM.SECURITY_LEVEL, value: T.SECURITY_LEVEL[template.securityLevel] },
    { label: 'מספר סידורי', value: `צ-${item.id}` },
    { label: T.COL_STATUS, value: T.ITEM_STATUS[item.status] },
  ];
  if (showHolder) {
    meta.push({
      label: T.COL_HOLDER,
      value: holderLabelFor(item.currentHolderType, item.currentHolderId, resolveHolderName),
    });
  }
  return <MetaList rows={meta} />;
}
