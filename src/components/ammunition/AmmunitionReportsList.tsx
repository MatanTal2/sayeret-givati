'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FEATURES } from '@/constants/text';
import type {
  AmmunitionReport,
  AmmunitionType,
  TrackingMode,
} from '@/types/ammunition';

const T = FEATURES.AMMUNITION;

export interface AmmunitionReportsListProps {
  reports: AmmunitionReport[];
  templates: AmmunitionType[];
  resolveReporterName?: (uid: string, fallback: string) => string;
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function amountLabel(r: AmmunitionReport, mode: TrackingMode): string {
  if (mode === 'BRUCE') {
    const parts: string[] = [];
    if (r.brucesConsumed) parts.push(`${r.brucesConsumed} ברוסים`);
    if (r.cardboardsConsumed) parts.push(`${r.cardboardsConsumed} קרטונים`);
    if (r.bulletsConsumed) parts.push(`${r.bulletsConsumed} כדורים`);
    return parts.join(' + ') || '—';
  }
  if (mode === 'SERIAL') {
    return r.itemSerials?.length ? `${r.itemSerials.length} פריטים` : '—';
  }
  return r.quantityConsumed ? `${r.quantityConsumed} יח׳` : '—';
}

export default function AmmunitionReportsList({
  reports,
  templates,
  resolveReporterName,
}: AmmunitionReportsListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const templatesById = useMemo(() => {
    const m = new Map<string, AmmunitionType>();
    templates.forEach((t) => m.set(t.id, t));
    return m;
  }, [templates]);

  if (reports.length === 0) {
    return (
      <div className="text-sm text-neutral-500 text-center py-6 border border-dashed border-neutral-200 rounded-lg">
        {T.HISTORY_REPORTS_EMPTY}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-neutral-200 rounded-lg">
      <table className="min-w-full text-right text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th className="w-8" />
            <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.HISTORY_COL_DATE}</th>
            <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.HISTORY_COL_TEMPLATE}</th>
            <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.HISTORY_COL_REPORTER}</th>
            <th className="px-3 py-2 text-xs font-medium text-neutral-600">{T.HISTORY_COL_AMOUNT}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {reports.map((r) => {
            const tpl = templatesById.get(r.templateId);
            const mode = tpl?.trackingMode ?? r.trackingMode;
            const usedAtMs = r.usedAt?.toMillis ? r.usedAt.toMillis() : 0;
            const reporter = resolveReporterName
              ? resolveReporterName(r.reporterId, r.reporterName)
              : r.reporterName;
            const isOpen = expanded === r.id;
            return (
              <React.Fragment key={r.id}>
                <tr
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                >
                  <td className="px-2">
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </td>
                  <td className="px-3 py-2 text-neutral-700 whitespace-nowrap">{fmtDate(usedAtMs)}</td>
                  <td className="px-3 py-2 text-neutral-900">{r.templateName}</td>
                  <td className="px-3 py-2 text-neutral-700">{reporter}</td>
                  <td className="px-3 py-2 text-neutral-700 whitespace-nowrap">
                    {amountLabel(r, mode)}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-neutral-50/60">
                    <td colSpan={5} className="px-6 py-3">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        <div className="flex gap-2">
                          <dt className="text-neutral-500 min-w-24">{T.HISTORY_COL_REASON}:</dt>
                          <dd className="text-neutral-800">{r.reason || '—'}</dd>
                        </div>
                        {r.itemSerials?.length ? (
                          <div className="flex gap-2 sm:col-span-2">
                            <dt className="text-neutral-500 min-w-24">סריאלים:</dt>
                            <dd className="text-neutral-800">
                              {r.itemSerials.map((s) => `צ-${s}`).join(', ')}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
