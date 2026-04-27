'use client';

import React, { useMemo, useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import { useAmmunitionTemplates } from '@/hooks/useAmmunitionTemplates';
import { useAmmunitionReports } from '@/hooks/useAmmunitionReports';
import { downloadReportsCsv } from '@/lib/ammunition/csvExport';
import { AMMUNITION_SUBCATEGORIES } from '@/lib/ammunition/subcategories';
import type {
  AmmunitionReport,
  AmmunitionSubcategory,
  AmmunitionType,
} from '@/types/ammunition';

const T = FEATURES.AMMUNITION;

type SortKey = 'usedAt' | 'reporterName' | 'templateName' | 'teamId';
type SortDir = 'asc' | 'desc';

function tsToMs(ts: unknown): number {
  if (!ts) return 0;
  const maybeDate = (ts as { toDate?: () => Date }).toDate;
  if (typeof maybeDate === 'function') return maybeDate.call(ts).getTime();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  const d = new Date(String(ts));
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function fmtDate(ts: unknown): string {
  const ms = tsToMs(ts);
  if (!ms) return '—';
  return new Date(ms).toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function consumedLabel(r: AmmunitionReport): string {
  if (r.trackingMode === 'BRUCE') {
    const parts: string[] = [];
    if (r.brucesConsumed) parts.push(`${r.brucesConsumed} ברוסים`);
    if (r.cardboardsConsumed) parts.push(`${r.cardboardsConsumed} קרטג׳ים`);
    if (r.bulletsConsumed) parts.push(`${r.bulletsConsumed} כדורים`);
    if (parts.length === 0) parts.push('—');
    return parts.join(' · ');
  }
  if (r.trackingMode === 'LOOSE_COUNT') {
    return r.quantityConsumed ? `${r.quantityConsumed} יח׳` : '—';
  }
  return (r.itemSerials || []).map((s) => `צ-${s}`).join(', ') || '—';
}

export default function AmmunitionReportsSection() {
  const { templates } = useAmmunitionTemplates();
  const { reports, isLoading, error } = useAmmunitionReports();

  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [subcategory, setSubcategory] = useState<AmmunitionSubcategory | ''>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');
  const [reporter, setReporter] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('usedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const templateById = useMemo(() => {
    const m = new Map<string, AmmunitionType>();
    templates.forEach((t) => m.set(t.id, t));
    return m;
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (!subcategory) return templates;
    return templates.filter((t) => t.subcategory === subcategory);
  }, [templates, subcategory]);

  const filtered = useMemo(() => {
    const fromMs = from ? new Date(from).getTime() : null;
    const toMs = to ? new Date(to).getTime() + 24 * 60 * 60 * 1000 : null;
    const reporterLower = reporter.trim().toLowerCase();
    const teamLower = teamId.trim().toLowerCase();
    return reports.filter((r) => {
      const ms = tsToMs(r.usedAt);
      if (fromMs !== null && ms < fromMs) return false;
      if (toMs !== null && ms > toMs) return false;
      if (subcategory) {
        const tpl = templateById.get(r.templateId);
        if (!tpl || tpl.subcategory !== subcategory) return false;
      }
      if (templateId && r.templateId !== templateId) return false;
      if (teamLower && !r.teamId.toLowerCase().includes(teamLower)) return false;
      if (reporterLower && !r.reporterName.toLowerCase().includes(reporterLower)) return false;
      return true;
    });
  }, [reports, from, to, subcategory, templateId, teamId, reporter, templateById]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      if (sortKey === 'usedAt') return (tsToMs(a.usedAt) - tsToMs(b.usedAt)) * dir;
      if (sortKey === 'reporterName') return a.reporterName.localeCompare(b.reporterName, 'he') * dir;
      if (sortKey === 'templateName') return a.templateName.localeCompare(b.templateName, 'he') * dir;
      return (a.teamId || '').localeCompare(b.teamId || '', 'he') * dir;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'usedAt' ? 'desc' : 'asc');
    }
  };

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '');

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadReportsCsv(sorted, templates, `ammunition-reports-${stamp}.csv`);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-lg bg-neutral-50 border border-neutral-200">
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">מתאריך</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">עד תאריך</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">תת-קטגוריה</label>
          <Select
            value={subcategory || null}
            onChange={(v) => {
              setSubcategory((v as AmmunitionSubcategory | null) ?? '');
              setTemplateId('');
            }}
            options={AMMUNITION_SUBCATEGORIES.map((s) => ({
              value: s,
              label: T.SUBCATEGORIES[s],
            }))}
            placeholder="הכל"
            clearable
            ariaLabel="תת-קטגוריה"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">פריט</label>
          <Select
            value={templateId || null}
            onChange={(v) => setTemplateId(v ?? '')}
            options={filteredTemplates.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="הכל"
            clearable
            ariaLabel="פריט"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">צוות</label>
          <input
            type="text"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="מזהה צוות"
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">מדווח</label>
          <input
            type="text"
            value={reporter}
            onChange={(e) => setReporter(e.target.value)}
            placeholder="שם מדווח"
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-600">סה&quot;כ {sorted.length} דיווחים</span>
        <Button onClick={exportCsv} disabled={sorted.length === 0} variant="secondary">
          <Download className="w-4 h-4 ms-1" /> ייצוא CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-500 text-center py-12">טוען...</div>
      ) : sorted.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-10 border border-dashed border-neutral-200 rounded-lg">
          אין דיווחים לתצוגה
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 rounded-lg">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th
                  onClick={() => toggleSort('usedAt')}
                  className="px-3 py-2 text-xs font-medium text-neutral-600 cursor-pointer select-none"
                >
                  תאריך שימוש {sortIndicator('usedAt')}
                </th>
                <th
                  onClick={() => toggleSort('reporterName')}
                  className="px-3 py-2 text-xs font-medium text-neutral-600 cursor-pointer select-none"
                >
                  מדווח {sortIndicator('reporterName')}
                </th>
                <th
                  onClick={() => toggleSort('teamId')}
                  className="px-3 py-2 text-xs font-medium text-neutral-600 cursor-pointer select-none"
                >
                  צוות {sortIndicator('teamId')}
                </th>
                <th
                  onClick={() => toggleSort('templateName')}
                  className="px-3 py-2 text-xs font-medium text-neutral-600 cursor-pointer select-none"
                >
                  פריט {sortIndicator('templateName')}
                </th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">כמות</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">סיבה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sorted.map((r) => {
                const tpl = templateById.get(r.templateId);
                return (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="px-3 py-2 text-xs text-neutral-700 whitespace-nowrap">
                      {fmtDate(r.usedAt)}
                    </td>
                    <td className="px-3 py-2 text-neutral-900">{r.reporterName}</td>
                    <td className="px-3 py-2 text-neutral-700">{r.teamId || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-neutral-900">{r.templateName}</span>
                        {tpl && (
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                              tpl.securityLevel === 'EXPLOSIVE'
                                ? 'bg-danger-100 text-danger-800'
                                : 'bg-warning-100 text-warning-800'
                            }`}
                          >
                            {T.SECURITY_LEVEL[tpl.securityLevel]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-neutral-700 whitespace-nowrap">
                      {consumedLabel(r)}
                    </td>
                    <td className="px-3 py-2 text-neutral-600 max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
