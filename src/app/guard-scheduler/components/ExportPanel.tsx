'use client';

import { useState } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';

const T = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.EXPORT;
const E = TEXT_CONSTANTS.FEATURES.GUARD_SCHEDULER.ERRORS;

interface Props {
  title: string;
  onTitleChange: (next: string) => void;
  buildText: (title: string) => string;
  buildCsv: (title: string) => string;
  onSave: (title: string) => Promise<string>;
  onShareClick: () => void;
  canSave: boolean;
  isSaved: boolean;
  saving: boolean;
}

function safeFilename(title: string, ext: string): string {
  const base = title.trim().replace(/[\s/\\]+/g, '-') || 'guard-schedule';
  return `${base}.${ext}`;
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ExportPanel({
  title,
  onTitleChange,
  buildText,
  buildCsv,
  onSave,
  onShareClick,
  canSave,
  isSaved,
  saving,
}: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const announce = (msg: string) => {
    setFeedback(msg);
    setError(null);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleCopy = async () => {
    const text = buildText(title);
    try {
      await navigator.clipboard.writeText(text);
      announce(T.COPIED);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      announce(T.COPIED);
    }
  };

  const handleDownloadCsv = () => {
    downloadBlob(buildCsv(title), safeFilename(title, 'csv'), 'text/csv;charset=utf-8');
  };

  const handleDownloadText = () => {
    downloadBlob(buildText(title), safeFilename(title, 'txt'), 'text/plain;charset=utf-8');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError(E.TITLE_REQUIRED);
      return;
    }
    setError(null);
    try {
      await onSave(title.trim());
      announce(T.SAVED);
    } catch (e) {
      setError(e instanceof Error ? e.message : E.SAVE_FAILED);
    }
  };

  return (
    <section className="card-base p-4 space-y-3">
      <h3 className="text-base font-medium text-neutral-800">{T.TITLE}</h3>
      <label className="flex flex-col text-sm text-neutral-700">
        <span>{T.TITLE_LABEL}</span>
        <input
          type="text"
          className="input-base mt-1"
          placeholder={T.TITLE_PLACEHOLDER}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={handleCopy}>{T.COPY_TEXT}</button>
        <button type="button" className="btn-secondary" onClick={handleDownloadText}>{T.DOWNLOAD_TEXT}</button>
        <button type="button" className="btn-secondary" onClick={handleDownloadCsv}>{T.DOWNLOAD_CSV}</button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? '…' : T.SAVE_CLOUD}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={onShareClick}
          disabled={!isSaved}
        >
          {T.SHARE_COPY}
        </button>
        <a
          href="/tools/guard-scheduler.html"
          download
          className="btn-ghost"
        >
          {T.OFFLINE_LINK}
        </a>
      </div>
      {feedback && <p role="status" aria-live="polite" className="text-sm text-success-600">{feedback}</p>}
      {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}
      <p className="text-xs text-neutral-500">{T.OFFLINE_HINT}</p>
    </section>
  );
}
