'use client';

import React, { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { FEATURES } from '@/constants/text';
import type {
  AmmunitionItem,
  AmmunitionStock,
  AmmunitionType,
  HolderType,
} from '@/types/ammunition';

const T = FEATURES.AMMUNITION;

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
  canMutate?: (entry: { templateId: string; holderType: HolderType; holderId: string }) => boolean;
  onDeleteStock?: (stockId: string) => void;
  onDeleteItem?: (serial: string) => void;
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
  onDeleteStock,
  onDeleteItem,
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
        <div key={g.template.id} className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-neutral-50 flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-neutral-900">{g.template.name}</h4>
            <span className="text-xs text-neutral-500">
              {T.SUBCATEGORIES[g.template.subcategory]} · {T.TRACKING_MODE[g.template.trackingMode]}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                g.template.securityLevel === 'EXPLOSIVE'
                  ? 'bg-danger-100 text-danger-800'
                  : 'bg-warning-100 text-warning-800'
              }`}
            >
              {T.SECURITY_LEVEL[g.template.securityLevel]}
            </span>
          </div>

          {g.template.trackingMode === 'BRUCE' && (
            <ul className="divide-y divide-neutral-100">
              {g.stockEntries.map((s) => (
                <li key={s.id} className="px-4 py-2 flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-medium text-neutral-900">
                      {s.bruceCount ?? 0} ברוסים
                      {s.openBruceState && s.openBruceState !== 'EMPTY' && (
                        <span className="text-xs text-neutral-500 ms-2">
                          + פתוח: {T.BRUCE_STATE[s.openBruceState]}
                        </span>
                      )}
                    </div>
                    {showHolder && (
                      <div className="text-xs text-neutral-500">
                        {holderLabel(s.holderType, s.holderId)}
                      </div>
                    )}
                  </div>
                  {canMutate?.({
                    templateId: g.template.id,
                    holderType: s.holderType,
                    holderId: s.holderId,
                  }) &&
                    onDeleteStock && (
                      <button
                        type="button"
                        onClick={() => onDeleteStock(s.id)}
                        className="p-1 rounded-md text-danger-500 hover:bg-danger-50"
                        aria-label="מחק"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </li>
              ))}
            </ul>
          )}

          {g.template.trackingMode === 'LOOSE_COUNT' && (
            <ul className="divide-y divide-neutral-100">
              {g.stockEntries.map((s) => (
                <li key={s.id} className="px-4 py-2 flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-medium text-neutral-900">{s.quantity ?? 0} יח&apos;</div>
                    {showHolder && (
                      <div className="text-xs text-neutral-500">
                        {holderLabel(s.holderType, s.holderId)}
                      </div>
                    )}
                  </div>
                  {canMutate?.({
                    templateId: g.template.id,
                    holderType: s.holderType,
                    holderId: s.holderId,
                  }) &&
                    onDeleteStock && (
                      <button
                        type="button"
                        onClick={() => onDeleteStock(s.id)}
                        className="p-1 rounded-md text-danger-500 hover:bg-danger-50"
                        aria-label="מחק"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </li>
              ))}
            </ul>
          )}

          {g.template.trackingMode === 'SERIAL' && (
            <ul className="divide-y divide-neutral-100">
              {g.itemEntries.map((it) => (
                <li key={it.id} className="px-4 py-2 flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-medium text-neutral-900">צ-{it.id}</div>
                    <div className="text-xs text-neutral-500">
                      {it.status === 'AVAILABLE'
                        ? 'זמין'
                        : it.status === 'CONSUMED'
                          ? 'נוצל'
                          : it.status === 'LOST'
                            ? 'אבד'
                            : 'פגום'}
                      {showHolder && (
                        <span className="ms-2">
                          · {holderLabel(it.currentHolderType, it.currentHolderId)}
                        </span>
                      )}
                    </div>
                  </div>
                  {canMutate?.({
                    templateId: g.template.id,
                    holderType: it.currentHolderType,
                    holderId: it.currentHolderId,
                  }) &&
                    onDeleteItem && (
                      <button
                        type="button"
                        onClick={() => onDeleteItem(it.id)}
                        className="p-1 rounded-md text-danger-500 hover:bg-danger-50"
                        aria-label="מחק"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
