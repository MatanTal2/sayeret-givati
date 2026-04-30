'use client';

import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, Trash2, Undo2 } from 'lucide-react';
import { FEATURES } from '@/constants/text';
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

export interface AmmunitionInventoryViewProps {
  templates: AmmunitionType[];
  stock: AmmunitionStock[];
  items: AmmunitionItem[];
  filter?: InventoryFilter;
  emptyMessage?: string;
  showHolder?: boolean;
  resolveHolderName?: (holderType: HolderType, holderId: string) => string;
  /** UI-side gate: which rows the actor can act on at all. Server re-validates. */
  canMutate?: (entry: { templateId: string; holderType: HolderType; holderId: string }) => boolean;
  /** Whether to surface a Delete button. Defaults to canMutate. */
  canDeleteRow?: (entry: { templateId: string; holderType: HolderType; holderId: string }) => boolean;
  onDeleteStock?: (stockId: string) => void;
  onDeleteItem?: (serial: string) => void;
  onTransferItem?: (item: AmmunitionItem) => void;
  onReturnItemToMgr?: (item: AmmunitionItem) => void;
}

interface Group {
  template: AmmunitionType;
  stockEntries: AmmunitionStock[];
  itemEntries: AmmunitionItem[];
}

export default function AmmunitionInventoryView({
  templates,
  stock,
  items,
  filter,
  emptyMessage,
  showHolder = false,
  resolveHolderName,
  canMutate,
  canDeleteRow,
  onDeleteStock,
  onDeleteItem,
  onTransferItem,
  onReturnItemToMgr,
}: AmmunitionInventoryViewProps) {
  const filteredStock = useMemo(() => {
    if (!filter) return stock;
    return stock.filter((s) => {
      if (filter.holderType && s.holderType !== filter.holderType) return false;
      if (filter.holderId && s.holderId !== filter.holderId) return false;
      return true;
    });
  }, [stock, filter]);

  const filteredItems = useMemo(() => {
    if (!filter) return items;
    return items.filter((i) => {
      if (filter.holderType && i.currentHolderType !== filter.holderType) return false;
      if (filter.holderId && i.currentHolderId !== filter.holderId) return false;
      return true;
    });
  }, [items, filter]);

  const groups = useMemo<Group[]>(() => {
    const byTemplate = new Map<string, Group>();
    for (const t of templates) {
      byTemplate.set(t.id, { template: t, stockEntries: [], itemEntries: [] });
    }
    for (const s of filteredStock) {
      const g = byTemplate.get(s.templateId);
      if (g) g.stockEntries.push(s);
    }
    for (const it of filteredItems) {
      const g = byTemplate.get(it.templateId);
      if (g) g.itemEntries.push(it);
    }
    return [...byTemplate.values()].filter(
      (g) => g.stockEntries.length > 0 || g.itemEntries.length > 0
    );
  }, [templates, filteredStock, filteredItems]);

  if (groups.length === 0) {
    return (
      <div className="text-sm text-neutral-500 text-center py-10 border border-dashed border-neutral-200 rounded-lg">
        {emptyMessage || T.EMPTY_INVENTORY}
      </div>
    );
  }

  const holderLabel = (holderType: HolderType, holderId: string) =>
    resolveHolderName ? resolveHolderName(holderType, holderId) : `${holderType}:${holderId}`;

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <TemplateGroup
          key={g.template.id}
          group={g}
          showHolder={showHolder}
          holderLabel={holderLabel}
          canMutate={canMutate}
          canDeleteRow={canDeleteRow ?? canMutate}
          onDeleteStock={onDeleteStock}
          onDeleteItem={onDeleteItem}
          onTransferItem={onTransferItem}
          onReturnItemToMgr={onReturnItemToMgr}
        />
      ))}
    </div>
  );
}

interface TemplateGroupProps {
  group: Group;
  showHolder: boolean;
  holderLabel: (ht: HolderType, hid: string) => string;
  canMutate?: (entry: { templateId: string; holderType: HolderType; holderId: string }) => boolean;
  canDeleteRow?: (entry: { templateId: string; holderType: HolderType; holderId: string }) => boolean;
  onDeleteStock?: (stockId: string) => void;
  onDeleteItem?: (serial: string) => void;
  onTransferItem?: (item: AmmunitionItem) => void;
  onReturnItemToMgr?: (item: AmmunitionItem) => void;
}

function TemplateGroup({
  group,
  showHolder,
  holderLabel,
  canMutate,
  canDeleteRow,
  onDeleteStock,
  onDeleteItem,
  onTransferItem,
  onReturnItemToMgr,
}: TemplateGroupProps) {
  const { template, stockEntries, itemEntries } = group;
  const availableItems = itemEntries.filter((i) => !USED_STATUSES.includes(i.status));
  const usedItems = itemEntries.filter((i) => USED_STATUSES.includes(i.status));

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-neutral-50 flex items-center gap-2 flex-wrap">
        <h4 className="text-sm font-semibold text-neutral-900">{template.name}</h4>
        <span className="text-xs text-neutral-500">
          {T.SUBCATEGORIES[template.subcategory]} · {T.TRACKING_MODE[template.trackingMode]}
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
            template.securityLevel === 'EXPLOSIVE'
              ? 'bg-danger-100 text-danger-800'
              : 'bg-warning-100 text-warning-800'
          }`}
        >
          {T.SECURITY_LEVEL[template.securityLevel]}
        </span>
      </div>

      {(template.trackingMode === 'BRUCE' || template.trackingMode === 'LOOSE_COUNT') && (
        <StockTable
          template={template}
          entries={stockEntries}
          showHolder={showHolder}
          holderLabel={holderLabel}
          canDeleteRow={canDeleteRow}
          onDeleteStock={onDeleteStock}
        />
      )}

      {template.trackingMode === 'SERIAL' && (
        <>
          <SerialItemsTable
            templateId={template.id}
            items={availableItems}
            showHolder={showHolder}
            holderLabel={holderLabel}
            greyed={false}
            canMutate={canMutate}
            canDeleteRow={canDeleteRow}
            onDeleteItem={onDeleteItem}
            onTransferItem={onTransferItem}
            onReturnItemToMgr={onReturnItemToMgr}
          />
          {usedItems.length > 0 && (
            <div className="border-t border-neutral-200 bg-neutral-50/40">
              <div className="px-4 py-2 text-xs font-medium text-neutral-500">
                {T.USED_SECTION}
              </div>
              <SerialItemsTable
                templateId={template.id}
                items={usedItems}
                showHolder={showHolder}
                holderLabel={holderLabel}
                greyed={true}
                canMutate={canMutate}
                canDeleteRow={canDeleteRow}
                onDeleteItem={onDeleteItem}
                onTransferItem={onTransferItem}
                onReturnItemToMgr={onReturnItemToMgr}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface StockTableProps {
  template: AmmunitionType;
  entries: AmmunitionStock[];
  showHolder: boolean;
  holderLabel: (ht: HolderType, hid: string) => string;
  canDeleteRow?: (entry: { templateId: string; holderType: HolderType; holderId: string }) => boolean;
  onDeleteStock?: (stockId: string) => void;
}

function StockTable({
  template,
  entries,
  showHolder,
  holderLabel,
  canDeleteRow,
  onDeleteStock,
}: StockTableProps) {
  if (entries.length === 0) return null;
  return (
    <table className="min-w-full text-right text-sm">
      <thead className="bg-neutral-50/60">
        <tr>
          <th className="px-3 py-1.5 text-xs font-medium text-neutral-600">כמות</th>
          {showHolder && <th className="px-3 py-1.5 text-xs font-medium text-neutral-600">מחזיק</th>}
          <th className="px-3 py-1.5 text-xs font-medium text-neutral-600 w-[1%]"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {entries.map((s) => {
          const allowDelete = canDeleteRow?.({
            templateId: template.id,
            holderType: s.holderType,
            holderId: s.holderId,
          });
          return (
            <tr key={s.id}>
              <td className="px-3 py-2 text-neutral-900">
                {template.trackingMode === 'BRUCE' ? (
                  <>
                    {s.bruceCount ?? 0} ברוסים
                    {s.openBruceState && s.openBruceState !== 'EMPTY' && (
                      <span className="text-xs text-neutral-500 ms-2">
                        + פתוח: {T.BRUCE_STATE[s.openBruceState]}
                      </span>
                    )}
                  </>
                ) : (
                  <>{s.quantity ?? 0} יח&apos;</>
                )}
              </td>
              {showHolder && (
                <td className="px-3 py-2 text-neutral-600 text-xs">
                  {holderLabel(s.holderType, s.holderId)}
                </td>
              )}
              <td className="px-3 py-2">
                {allowDelete && onDeleteStock && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(T.INVENTORY_ACTIONS.DELETE_CONFIRM)) onDeleteStock(s.id);
                    }}
                    className="p-1 rounded-md text-danger-500 hover:bg-danger-50"
                    aria-label={T.INVENTORY_ACTIONS.DELETE}
                    title={T.INVENTORY_ACTIONS.DELETE}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

interface SerialItemsTableProps {
  templateId: string;
  items: AmmunitionItem[];
  showHolder: boolean;
  holderLabel: (ht: HolderType, hid: string) => string;
  greyed: boolean;
  canMutate?: (entry: { templateId: string; holderType: HolderType; holderId: string }) => boolean;
  canDeleteRow?: (entry: { templateId: string; holderType: HolderType; holderId: string }) => boolean;
  onDeleteItem?: (serial: string) => void;
  onTransferItem?: (item: AmmunitionItem) => void;
  onReturnItemToMgr?: (item: AmmunitionItem) => void;
}

function SerialItemsTable({
  templateId,
  items,
  showHolder,
  holderLabel,
  greyed,
  canMutate,
  canDeleteRow,
  onDeleteItem,
  onTransferItem,
  onReturnItemToMgr,
}: SerialItemsTableProps) {
  const [busy, setBusy] = useState<string | null>(null);
  if (items.length === 0) return null;

  const handleReturn = async (item: AmmunitionItem) => {
    if (!onReturnItemToMgr) return;
    if (!window.confirm(T.INVENTORY_ACTIONS.RETURN_CONFIRM)) return;
    setBusy(item.id);
    try {
      await onReturnItemToMgr(item);
    } finally {
      setBusy(null);
    }
  };

  return (
    <table className={`min-w-full text-right text-sm ${greyed ? 'opacity-70' : ''}`}>
      <thead className="bg-neutral-50/60">
        <tr>
          <th className="px-3 py-1.5 text-xs font-medium text-neutral-600">צ׳</th>
          <th className="px-3 py-1.5 text-xs font-medium text-neutral-600">סטטוס</th>
          {showHolder && <th className="px-3 py-1.5 text-xs font-medium text-neutral-600">מחזיק</th>}
          <th className="px-3 py-1.5 text-xs font-medium text-neutral-600 w-[1%]"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {items.map((it) => {
          const entry = {
            templateId,
            holderType: it.currentHolderType,
            holderId: it.currentHolderId,
          };
          const isAvailable = it.status === 'AVAILABLE';
          const isConsumed = it.status === 'CONSUMED';
          const allowMutate = canMutate?.(entry);
          const allowDelete = canDeleteRow?.(entry);
          const showTransfer = isAvailable && allowMutate && !!onTransferItem;
          const showReturn = isConsumed && allowMutate && !!onReturnItemToMgr;
          const showDelete = isAvailable && allowDelete && !!onDeleteItem;
          return (
            <tr key={it.id}>
              <td className="px-3 py-2 font-medium text-neutral-900">צ-{it.id}</td>
              <td className="px-3 py-2 text-neutral-700 text-xs">
                {T.ITEM_STATUS[it.status]}
              </td>
              {showHolder && (
                <td className="px-3 py-2 text-neutral-600 text-xs">
                  {holderLabel(it.currentHolderType, it.currentHolderId)}
                </td>
              )}
              <td className="px-3 py-2">
                <div className="flex items-center gap-1 justify-end">
                  {showTransfer && (
                    <button
                      type="button"
                      onClick={() => onTransferItem?.(it)}
                      disabled={busy === it.id}
                      className="p-1 rounded-md text-primary-600 hover:bg-primary-50 disabled:opacity-50"
                      aria-label={T.INVENTORY_ACTIONS.TRANSFER}
                      title={T.INVENTORY_ACTIONS.TRANSFER}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  )}
                  {showReturn && (
                    <button
                      type="button"
                      onClick={() => handleReturn(it)}
                      disabled={busy === it.id}
                      className="p-1 rounded-md text-warning-700 hover:bg-warning-50 disabled:opacity-50"
                      aria-label={T.INVENTORY_ACTIONS.RETURN_TO_MGR}
                      title={T.INVENTORY_ACTIONS.RETURN_TO_MGR}
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  )}
                  {showDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(T.INVENTORY_ACTIONS.DELETE_CONFIRM)) onDeleteItem?.(it.id);
                      }}
                      disabled={busy === it.id}
                      className="p-1 rounded-md text-danger-500 hover:bg-danger-50 disabled:opacity-50"
                      aria-label={T.INVENTORY_ACTIONS.DELETE}
                      title={T.INVENTORY_ACTIONS.DELETE}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
