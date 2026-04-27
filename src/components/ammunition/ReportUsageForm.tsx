'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import type {
  AmmunitionItem,
  AmmunitionStock,
  AmmunitionType,
  BruceState,
} from '@/types/ammunition';
import type { SubmitReportPayload } from '@/hooks/useAmmunitionReports';

const T = FEATURES.AMMUNITION;

const BRUCE_STATES: BruceState[] = ['FULL', 'MORE_THAN_HALF', 'LESS_THAN_HALF', 'EMPTY'];

export interface ReportUsageFormProps {
  templates: AmmunitionType[];
  /** Reporter's stock + items, already filtered to USER holder == reporter. */
  myStock: AmmunitionStock[];
  myItems: AmmunitionItem[];
  /** When set, the report is attached to this manager-triggered request and the
   *  template picker is constrained to the request's templateIds (if any). */
  reportRequestId?: string;
  /** Optional template-id allowlist (typically from the linked request). */
  restrictTemplateIds?: string[];
  onClose: () => void;
  onSubmit: (payload: SubmitReportPayload) => Promise<{ ok: boolean; reportId?: string }>;
}

function nowLocalInput(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function ReportUsageForm({
  templates,
  myStock,
  myItems,
  reportRequestId,
  restrictTemplateIds,
  onClose,
  onSubmit,
}: ReportUsageFormProps) {
  const reportableTemplateIds = useMemo(() => {
    const ids = new Set<string>();
    myStock.forEach((s) => ids.add(s.templateId));
    myItems.forEach((i) => ids.add(i.templateId));
    return ids;
  }, [myStock, myItems]);

  const reportableTemplates = useMemo(() => {
    let list = templates.filter((t) => reportableTemplateIds.has(t.id));
    if (restrictTemplateIds && restrictTemplateIds.length > 0) {
      const allow = new Set(restrictTemplateIds);
      list = list.filter((t) => allow.has(t.id));
    }
    return list;
  }, [templates, reportableTemplateIds, restrictTemplateIds]);

  const [templateId, setTemplateId] = useState<string>('');
  const [bruces, setBruces] = useState('');
  const [cardboards, setCardboards] = useState('');
  const [bullets, setBullets] = useState('');
  const [finalState, setFinalState] = useState<BruceState>('EMPTY');
  const [quantity, setQuantity] = useState('');
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState('');
  const [usedAt, setUsedAt] = useState<string>(() => nowLocalInput());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId && reportableTemplates.length > 0) {
      setTemplateId(reportableTemplates[0].id);
    }
  }, [reportableTemplates, templateId]);

  useEffect(() => {
    setSelectedSerials(new Set());
    setBruces('');
    setCardboards('');
    setBullets('');
    setQuantity('');
  }, [templateId]);

  const template = useMemo(
    () => reportableTemplates.find((t) => t.id === templateId) || null,
    [reportableTemplates, templateId]
  );

  const myStockEntry = useMemo(
    () => (template ? myStock.find((s) => s.templateId === template.id) : undefined),
    [myStock, template]
  );

  const myItemsForTemplate = useMemo(
    () =>
      template
        ? myItems.filter((i) => i.templateId === template.id && i.status === 'AVAILABLE')
        : [],
    [myItems, template]
  );

  const toggleSerial = (serial: string) => {
    setSelectedSerials((prev) => {
      const next = new Set(prev);
      if (next.has(serial)) next.delete(serial);
      else next.add(serial);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!template) {
      setError('יש לבחור פריט');
      return;
    }
    if (!reason.trim()) {
      setError('יש להזין סיבה');
      return;
    }
    const usedAtMs = new Date(usedAt).getTime();
    if (!Number.isFinite(usedAtMs)) {
      setError('תאריך לא תקין');
      return;
    }

    const payload: SubmitReportPayload = {
      templateId: template.id,
      reason: reason.trim(),
      usedAtMs,
    };
    if (reportRequestId) payload.reportRequestId = reportRequestId;

    if (template.trackingMode === 'BRUCE') {
      const b = bruces ? Number(bruces) : 0;
      const c = cardboards ? Number(cardboards) : undefined;
      const bl = bullets ? Number(bullets) : undefined;
      if (b < 0 || (c !== undefined && c < 0) || (bl !== undefined && bl < 0)) {
        setError('כמויות שליליות לא חוקיות');
        return;
      }
      payload.brucesConsumed = b;
      if (c !== undefined) payload.cardboardsConsumed = c;
      if (bl !== undefined) payload.bulletsConsumed = bl;
      payload.finalOpenBruceState = finalState;
    } else if (template.trackingMode === 'LOOSE_COUNT') {
      const q = Number(quantity);
      if (!Number.isFinite(q) || q <= 0) {
        setError('יש להזין כמות חיובית');
        return;
      }
      payload.quantityConsumed = q;
    } else {
      if (selectedSerials.size === 0) {
        setError('יש לבחור לפחות מספר סידורי אחד');
        return;
      }
      payload.itemSerials = Array.from(selectedSerials);
    }

    setSubmitting(true);
    const result = await onSubmit(payload);
    setSubmitting(false);
    if (result.ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">{T.REPORT_USE}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100"
            aria-label="close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
              {error}
            </div>
          )}

          {reportableTemplates.length === 0 ? (
            <div className="text-sm text-neutral-500 text-center py-6">
              {T.EMPTY_INVENTORY}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {T.REPORT_FORM.TEMPLATE}
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {reportableTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {T.TRACKING_MODE[t.trackingMode]}
                    </option>
                  ))}
                </select>
              </div>

              {template?.trackingMode === 'BRUCE' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        {T.REPORT_FORM.BRUCES_CONSUMED}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={bruces}
                        onChange={(e) => setBruces(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        {T.REPORT_FORM.CARDBOARDS_CONSUMED}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={cardboards}
                        onChange={(e) => setCardboards(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        {T.REPORT_FORM.BULLETS_CONSUMED}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={bullets}
                        onChange={(e) => setBullets(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {T.REPORT_FORM.FINAL_BRUCE_STATE}
                    </label>
                    <select
                      value={finalState}
                      onChange={(e) => setFinalState(e.target.value as BruceState)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {BRUCE_STATES.map((s) => (
                        <option key={s} value={s}>
                          {T.BRUCE_STATE[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  {myStockEntry && (
                    <p className="text-xs text-neutral-500">
                      מלאי נוכחי: {myStockEntry.bruceCount ?? 0} ברוסים · פתוח:{' '}
                      {T.BRUCE_STATE[myStockEntry.openBruceState || 'EMPTY']}
                    </p>
                  )}
                </div>
              )}

              {template?.trackingMode === 'LOOSE_COUNT' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {T.REPORT_FORM.QUANTITY_CONSUMED}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  {myStockEntry && (
                    <p className="text-xs text-neutral-500 mt-1">
                      מלאי נוכחי: {myStockEntry.quantity ?? 0} יח&apos;
                    </p>
                  )}
                </div>
              )}

              {template?.trackingMode === 'SERIAL' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {T.REPORT_FORM.SERIALS_CONSUMED}
                  </label>
                  {myItemsForTemplate.length === 0 ? (
                    <p className="text-xs text-neutral-500">אין פריטים זמינים</p>
                  ) : (
                    <ul className="border border-neutral-200 rounded-lg max-h-48 overflow-y-auto">
                      {myItemsForTemplate.map((item) => (
                        <li key={item.id} className="border-b border-neutral-100 last:border-b-0">
                          <label className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSerials.has(item.id)}
                              onChange={() => toggleSerial(item.id)}
                              className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-neutral-900">צ-{item.id}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {T.REPORT_FORM.REASON}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {T.REPORT_FORM.USED_AT}
                </label>
                <input
                  type="datetime-local"
                  value={usedAt}
                  onChange={(e) => setUsedAt(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              ביטול
            </Button>
            <Button type="submit" disabled={submitting || reportableTemplates.length === 0}>
              {submitting ? 'שולח...' : 'שלח דיווח'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
