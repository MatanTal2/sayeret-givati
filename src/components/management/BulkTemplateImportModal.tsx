'use client';

import React, { useMemo, useRef, useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { parseCsv, buildCsv } from '@/lib/csv/parseCsv';

export interface BulkRowResult<T> {
  payload?: T;
  error?: string;
}

export interface BulkSubmitResult {
  created: number;
  errors: Array<{ index: number; error: string }>;
}

export interface BulkTemplateImportModalProps<T> {
  title: string;
  csvHeaders: ReadonlyArray<string>;
  csvSampleRow: Record<string, string>;
  csvFileName: string;
  mapRow: (row: Record<string, string>) => BulkRowResult<T>;
  onSubmit: (payloads: T[]) => Promise<BulkSubmitResult>;
  onClose: () => void;
}

interface PreviewRow<T> {
  index: number;
  raw: Record<string, string>;
  payload?: T;
  error?: string;
}

export default function BulkTemplateImportModal<T>({
  title,
  csvHeaders,
  csvSampleRow,
  csvFileName,
  mapRow,
  onSubmit,
  onClose,
}: BulkTemplateImportModalProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PreviewRow<T>[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Array<{ index: number; error: string }>>([]);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const validCount = useMemo(() => rows.filter((r) => r.payload && !r.error).length, [rows]);
  const invalidCount = rows.length - validCount;

  const handleDownloadSample = () => {
    const csv = buildCsv([...csvHeaders], [csvSampleRow]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setResultMsg(null);
    setServerErrors([]);
    const text = await file.text();
    const parsed = parseCsv(text);
    const out: PreviewRow<T>[] = parsed.rows.map((raw, i) => {
      const result = mapRow(raw);
      return { index: i, raw, payload: result.payload, error: result.error };
    });
    setRows(out);
  };

  const handleSubmit = async () => {
    const payloads = rows.filter((r) => r.payload).map((r) => r.payload!) as T[];
    if (payloads.length === 0) return;
    setSubmitting(true);
    setServerErrors([]);
    setResultMsg(null);
    try {
      const result = await onSubmit(payloads);
      if (result.errors.length > 0) {
        setServerErrors(result.errors);
        setResultMsg(`שרת דחה ${result.errors.length} שורות. תקן את ה-CSV ונסה שוב.`);
      } else {
        setResultMsg(`נוצרו ${result.created} תבניות.`);
        setRows([]);
      }
    } catch (e) {
      setResultMsg(e instanceof Error ? e.message : 'שגיאה לא צפויה');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-neutral-900/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" onClick={handleDownloadSample} type="button">
              <Download className="w-4 h-4 ms-1" /> הורד תבנית CSV
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
            <Button onClick={() => inputRef.current?.click()} type="button">
              <Upload className="w-4 h-4 ms-1" /> בחר קובץ CSV
            </Button>
          </div>

          <p className="text-xs text-neutral-500">
            כותרות נדרשות: {csvHeaders.join(', ')}
          </p>

          {rows.length === 0 ? (
            <div className="text-sm text-neutral-500 text-center py-10 border border-dashed border-neutral-200 rounded-lg">
              לא נבחר קובץ
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 text-success-700">
                  <CheckCircle2 className="w-4 h-4" /> תקינות: {validCount}
                </span>
                <span className="inline-flex items-center gap-1 text-danger-700">
                  <AlertCircle className="w-4 h-4" /> שגיאות: {invalidCount}
                </span>
              </div>

              <div className="overflow-x-auto border border-neutral-200 rounded-lg max-h-80">
                <table className="min-w-full text-right text-xs">
                  <thead className="bg-neutral-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-neutral-600 font-medium">#</th>
                      {csvHeaders.map((h) => (
                        <th key={h} className="px-3 py-2 text-neutral-600 font-medium">
                          {h}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-neutral-600 font-medium">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {rows.map((r) => {
                      const serverErr = serverErrors.find((s) => s.index === r.index)?.error;
                      const err = r.error || serverErr;
                      return (
                        <tr key={r.index} className={err ? 'bg-danger-50/50' : ''}>
                          <td className="px-3 py-2 text-neutral-500">{r.index + 1}</td>
                          {csvHeaders.map((h) => (
                            <td key={h} className="px-3 py-2 text-neutral-800">
                              {r.raw[h] ?? ''}
                            </td>
                          ))}
                          <td className="px-3 py-2">
                            {err ? (
                              <span className="text-danger-700">{err}</span>
                            ) : (
                              <span className="text-success-700">תקין</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {resultMsg && (
            <div
              className={`p-3 rounded-lg text-sm ${
                serverErrors.length > 0
                  ? 'bg-danger-50 border border-danger-200 text-danger-800'
                  : 'bg-success-50 border border-success-200 text-success-800'
              }`}
            >
              {resultMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              סגור
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || validCount === 0 || invalidCount > 0}
            >
              {submitting ? 'מייבא...' : `ייבא ${validCount} תבניות`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
