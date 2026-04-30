'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import { useAmmunitionInventory } from '@/hooks/useAmmunitionInventory';
import { useAmmunitionTemplates } from '@/hooks/useAmmunitionTemplates';
import type {
  AmmunitionItem,
  AmmunitionStock,
  AmmunitionType,
} from '@/types/ammunition';
import type { TrainingPlan } from '@/types/training';
import RestockRequestModal from './RestockRequestModal';

const TT = FEATURES.AMMUNITION.TRAINING;

interface BellyRow {
  template: AmmunitionType;
  available: number;
  allocated: number;
  total: number;
}

function totalForTemplate(
  template: AmmunitionType,
  stock: AmmunitionStock[],
  items: AmmunitionItem[]
): number {
  if (template.trackingMode === 'BRUCE') {
    const cpb = template.cardboardsPerBruce ?? 0;
    const bpc = template.bulletsPerCardboard ?? 0;
    return stock
      .filter((s) => s.templateId === template.id)
      .reduce((acc, s) => acc + (s.bruceCount ?? 0) * cpb * bpc, 0);
  }
  if (template.trackingMode === 'BELT') {
    const spb = template.stringsPerBruce ?? 0;
    const bps = template.bulletsPerString ?? 0;
    return stock
      .filter((s) => s.templateId === template.id)
      .reduce((acc, s) => acc + (s.bruceCount ?? 0) * spb * bps, 0);
  }
  if (template.trackingMode === 'LOOSE_COUNT') {
    return stock
      .filter((s) => s.templateId === template.id)
      .reduce((acc, s) => acc + (s.quantity ?? 0), 0);
  }
  // SERIAL
  return items.filter((i) => i.templateId === template.id && i.status === 'AVAILABLE').length;
}

export interface AmmunitionBellyViewProps {
  plans: TrainingPlan[];
  onSubmitRestock: (
    planId: string,
    payload: { templateId: string; templateName: string; shortfallQty: number; note?: string }
  ) => Promise<boolean>;
}

export default function AmmunitionBellyView({ plans, onSubmitRestock }: AmmunitionBellyViewProps) {
  const { stock, items, isLoading: invLoading } = useAmmunitionInventory();
  const { templates, isLoading: tplLoading } = useAmmunitionTemplates();
  const [restockTarget, setRestockTarget] = useState<{
    template: AmmunitionType;
    shortfallQty: number;
  } | null>(null);

  const allocatedByTemplate = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of plans) {
      if (p.status !== 'APPROVED' && p.status !== 'PENDING_APPROVAL') continue;
      for (const line of p.ammoLines) {
        m.set(line.templateId, (m.get(line.templateId) ?? 0) + line.qty);
      }
    }
    return m;
  }, [plans]);

  const rows: BellyRow[] = useMemo(() => {
    return templates
      .map((t) => {
        const total = totalForTemplate(t, stock, items);
        const allocated = allocatedByTemplate.get(t.id) ?? 0;
        return { template: t, total, allocated, available: total - allocated };
      })
      .filter((r) => r.total > 0 || r.allocated > 0)
      .sort((a, b) => a.template.name.localeCompare(b.template.name, 'he'));
  }, [templates, stock, items, allocatedByTemplate]);

  if (invLoading || tplLoading) {
    return <div className="text-sm text-neutral-500 text-center py-6">{TT.LOADING}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900">{TT.BELLY_TITLE}</h3>
        <span className="text-xs text-neutral-500">{TT.BELLY_SUBTITLE}</span>
      </div>
      {rows.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-6 border border-dashed border-neutral-200 rounded-lg">
          {TT.BELLY_EMPTY}
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 rounded-lg">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.BELLY_COL_TEMPLATE}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.BELLY_COL_TOTAL}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.BELLY_COL_ALLOCATED}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.BELLY_COL_AVAILABLE}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.BELLY_COL_ACTIONS}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((r) => {
                const shortfall = r.available < 0;
                return (
                  <tr
                    key={r.template.id}
                    className={shortfall ? 'bg-danger-50/40' : 'hover:bg-neutral-50'}
                  >
                    <td className="px-3 py-2 text-neutral-900">{r.template.name}</td>
                    <td className="px-3 py-2 text-neutral-700">{r.total}</td>
                    <td className="px-3 py-2 text-neutral-700">{r.allocated}</td>
                    <td
                      className={`px-3 py-2 font-medium ${
                        shortfall ? 'text-danger-700' : 'text-neutral-900'
                      }`}
                    >
                      {r.available}
                    </td>
                    <td className="px-3 py-2">
                      {shortfall && (
                        <Button
                          variant="danger"
                          onClick={() =>
                            setRestockTarget({
                              template: r.template,
                              shortfallQty: -r.available,
                            })
                          }
                        >
                          <AlertTriangle className="w-4 h-4 ms-1" />
                          {TT.REQUEST_RESTOCK}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {restockTarget && (
        <RestockRequestModal
          template={restockTarget.template}
          shortfallQty={restockTarget.shortfallQty}
          plans={plans.filter(
            (p) =>
              (p.status === 'PENDING_APPROVAL' || p.status === 'APPROVED') &&
              p.ammoLines.some((l) => l.templateId === restockTarget.template.id)
          )}
          onClose={() => setRestockTarget(null)}
          onSubmit={onSubmitRestock}
        />
      )}
    </div>
  );
}
