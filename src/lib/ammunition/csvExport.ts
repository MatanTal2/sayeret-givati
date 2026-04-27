/**
 * CSV serializer for ammunition reports.
 *
 * Output is BOM-prefixed UTF-8 so Excel opens Hebrew correctly without
 * the user manually selecting an encoding. Cells are quoted only when they
 * contain a comma, quote, or newline — quotes inside cells are doubled.
 */
import type { AmmunitionReport, AmmunitionType } from '@/types/ammunition';
import { FEATURES } from '@/constants/text';

const T = FEATURES.AMMUNITION;

const HEADERS = [
  'תאריך שימוש',
  'תאריך דיווח',
  'מדווח',
  'צוות',
  'פריט',
  'תת-קטגוריה',
  'אבטחה',
  'מצב מעקב',
  'כמות שנצרכה',
  'סיבה',
];

function quoteCell(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  const s = String(raw);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function isoDate(ts: unknown): string {
  if (!ts) return '';
  // Firestore Timestamp shape — has toDate. May also be a Date or millis.
  // We avoid pulling firebase types here; trust shape and fall back gracefully.
  const maybeDate = (ts as { toDate?: () => Date }).toDate;
  const d =
    typeof maybeDate === 'function'
      ? maybeDate.call(ts)
      : ts instanceof Date
        ? ts
        : typeof ts === 'number'
          ? new Date(ts)
          : new Date(String(ts));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function consumedFor(report: AmmunitionReport): string {
  if (report.trackingMode === 'BRUCE') {
    const parts: string[] = [];
    if (report.brucesConsumed) parts.push(`${report.brucesConsumed} ברוסים`);
    if (report.cardboardsConsumed) parts.push(`${report.cardboardsConsumed} קרטג׳ים`);
    if (report.bulletsConsumed) parts.push(`${report.bulletsConsumed} כדורים`);
    if (report.finalOpenBruceState && report.finalOpenBruceState !== 'EMPTY') {
      parts.push(`פתוח: ${T.BRUCE_STATE[report.finalOpenBruceState]}`);
    }
    return parts.join(' · ');
  }
  if (report.trackingMode === 'LOOSE_COUNT') {
    return report.quantityConsumed ? `${report.quantityConsumed} יח׳` : '';
  }
  return (report.itemSerials || []).map((s) => `צ-${s}`).join(', ');
}

export function reportsToCsv(
  reports: AmmunitionReport[],
  templates: AmmunitionType[]
): string {
  const templateById = new Map(templates.map((t) => [t.id, t]));
  const rows: string[] = [HEADERS.map(quoteCell).join(',')];

  for (const r of reports) {
    const tpl = templateById.get(r.templateId);
    rows.push(
      [
        isoDate(r.usedAt),
        isoDate(r.createdAt),
        r.reporterName,
        r.teamId || '',
        r.templateName,
        tpl ? T.SUBCATEGORIES[tpl.subcategory] : '',
        tpl ? T.SECURITY_LEVEL[tpl.securityLevel] : '',
        T.TRACKING_MODE[r.trackingMode],
        consumedFor(r),
        r.reason,
      ]
        .map(quoteCell)
        .join(',')
    );
  }

  return '﻿' + rows.join('\r\n');
}

export function downloadReportsCsv(
  reports: AmmunitionReport[],
  templates: AmmunitionType[],
  filename = 'ammunition-reports.csv'
): void {
  const csv = reportsToCsv(reports, templates);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
