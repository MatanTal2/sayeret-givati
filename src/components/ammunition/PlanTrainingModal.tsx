'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { useAmmunitionTemplates } from '@/hooks/useAmmunitionTemplates';
import { AMMUNITION_SUBCATEGORIES } from '@/lib/ammunition/subcategories';
import { UserType } from '@/types/user';
import type {
  AmmunitionSubcategory,
  AmmunitionType,
} from '@/types/ammunition';
import type {
  CreateTrainingPlanInput,
  TrainingAmmoLine,
} from '@/types/training';

const T = FEATURES.AMMUNITION;
const TT = FEATURES.AMMUNITION.TRAINING;

interface AmmoLineDraft {
  id: string;
  subcategory: AmmunitionSubcategory | null;
  templateId: string;
  qtyText: string;
}

function nowLocalInput(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60_000);
  return local.toISOString().slice(0, 16);
}

function plusHoursLocalInput(hours: number): string {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60_000);
  return local.toISOString().slice(0, 16);
}

function localInputToMs(s: string): number {
  return new Date(s).getTime();
}

function newDraftLine(): AmmoLineDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    subcategory: null,
    templateId: '',
    qtyText: '',
  };
}

export interface PlanTrainingModalProps {
  onClose: () => void;
  onSubmit: (payload: CreateTrainingPlanInput) => Promise<{ ok: boolean; id?: string }>;
}

export default function PlanTrainingModal({ onClose, onSubmit }: PlanTrainingModalProps) {
  const { enhancedUser } = useAuth();
  const { config: systemConfig } = useSystemConfig();
  const { templates } = useAmmunitionTemplates();

  const isAdminOrSysMgr =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER;

  const [startInput, setStartInput] = useState<string>(plusHoursLocalInput(24));
  const [endInput, setEndInput] = useState<string>(plusHoursLocalInput(27));
  const [teamId, setTeamId] = useState<string>(enhancedUser?.teamId || '');
  const [rangeLocation, setRangeLocation] = useState('');
  const [contactName, setContactName] = useState(enhancedUser?.displayName || '');
  const [contactPhone, setContactPhone] = useState('');
  const [radioFrequency, setRadioFrequency] = useState('');
  const [headcountText, setHeadcountText] = useState('');
  const [notes, setNotes] = useState('');
  const [ammoLines, setAmmoLines] = useState<AmmoLineDraft[]>([newDraftLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: { value: string; label: string }[] = [];
    for (const t of systemConfig?.teams ?? []) {
      if (!seen.has(t)) {
        seen.add(t);
        out.push({ value: t, label: t });
      }
    }
    if (enhancedUser?.teamId && !seen.has(enhancedUser.teamId)) {
      out.push({ value: enhancedUser.teamId, label: enhancedUser.teamId });
    }
    return out;
  }, [systemConfig?.teams, enhancedUser?.teamId]);

  const templatesById = useMemo(() => {
    const m = new Map<string, AmmunitionType>();
    templates.forEach((t) => m.set(t.id, t));
    return m;
  }, [templates]);

  const updateLine = (id: string, patch: Partial<AmmoLineDraft>) => {
    setAmmoLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const addLine = () => setAmmoLines((prev) => [...prev, newDraftLine()]);

  const removeLine = (id: string) => {
    setAmmoLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const startMs = localInputToMs(startInput);
    const endMs = localInputToMs(endInput);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      setError(TT.ERR_INVALID_DATES);
      return;
    }
    if (endMs <= startMs) {
      setError(TT.ERR_END_BEFORE_START);
      return;
    }
    if (!teamId.trim()) {
      setError(TT.ERR_TEAM_REQUIRED);
      return;
    }
    if (!rangeLocation.trim() || !contactName.trim() || !contactPhone.trim() || !radioFrequency.trim()) {
      setError(TT.ERR_FIELDS_REQUIRED);
      return;
    }
    const headcount = Number(headcountText);
    if (!Number.isFinite(headcount) || headcount < 1) {
      setError(TT.ERR_HEADCOUNT_INVALID);
      return;
    }

    const lines: TrainingAmmoLine[] = [];
    for (const l of ammoLines) {
      if (!l.templateId) {
        setError(TT.ERR_AMMO_LINE_INCOMPLETE);
        return;
      }
      const qty = Number(l.qtyText);
      if (!Number.isFinite(qty) || qty <= 0) {
        setError(TT.ERR_AMMO_LINE_QTY);
        return;
      }
      const tpl = templatesById.get(l.templateId);
      if (!tpl) {
        setError(TT.ERR_AMMO_LINE_INCOMPLETE);
        return;
      }
      lines.push({ templateId: l.templateId, templateName: tpl.name, qty });
    }
    if (lines.length === 0) {
      setError(TT.ERR_AMMO_LINE_INCOMPLETE);
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit({
        teamId: teamId.trim(),
        startAtMs: startMs,
        endAtMs: endMs,
        rangeLocation: rangeLocation.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        radioFrequency: radioFrequency.trim(),
        headcount,
        ammoLines: lines,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      if (result.ok) onClose();
      else setError(TT.ERR_SUBMIT_FAILED);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">{TT.PLAN_TITLE}</h3>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.START_AT}</label>
              <input
                type="datetime-local"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                min={nowLocalInput()}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.END_AT}</label>
              <input
                type="datetime-local"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                min={startInput}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.TEAM}</label>
            <Select
              value={teamId || null}
              onChange={(v) => setTeamId(v ?? '')}
              options={teamOptions}
              placeholder={teamOptions.length === 0 ? 'לא הוגדרו צוותים' : 'בחר צוות'}
              disabled={!isAdminOrSysMgr || teamOptions.length === 0}
              ariaLabel={TT.TEAM}
            />
            {!isAdminOrSysMgr && (
              <p className="mt-1 text-xs text-neutral-500">{TT.TEAM_LOCKED_HINT}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.RANGE_LOCATION}</label>
              <input
                type="text"
                value={rangeLocation}
                onChange={(e) => setRangeLocation(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.RADIO_FREQ}</label>
              <input
                type="text"
                value={radioFrequency}
                onChange={(e) => setRadioFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.CONTACT_NAME}</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.CONTACT_PHONE}</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.HEADCOUNT}</label>
              <input
                type="number"
                min={1}
                value={headcountText}
                onChange={(e) => setHeadcountText(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-700">{TT.AMMO_LINES}</label>
              <Button type="button" variant="secondary" onClick={addLine}>
                <Plus className="w-4 h-4 ms-1" />
                {TT.ADD_AMMO_LINE}
              </Button>
            </div>
            <div className="space-y-2">
              {ammoLines.map((line) => {
                const filtered = line.subcategory
                  ? templates.filter((t) => t.subcategory === line.subcategory)
                  : [];
                return (
                  <div
                    key={line.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_auto] gap-2 items-end p-3 rounded-lg bg-neutral-50 border border-neutral-200"
                  >
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        {T.TEMPLATE_FORM.SUBCATEGORY}
                      </label>
                      <Select<AmmunitionSubcategory>
                        value={line.subcategory}
                        onChange={(v) => updateLine(line.id, { subcategory: v, templateId: '' })}
                        options={AMMUNITION_SUBCATEGORIES.map((s) => ({
                          value: s,
                          label: T.SUBCATEGORIES[s],
                        }))}
                        placeholder="בחר תת-קטגוריה"
                        clearable
                        ariaLabel={T.TEMPLATE_FORM.SUBCATEGORY}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        {T.REPORT_FORM.TEMPLATE}
                      </label>
                      <Select
                        value={line.templateId || null}
                        onChange={(v) => updateLine(line.id, { templateId: v ?? '' })}
                        options={filtered.map((t) => ({ value: t.id, label: t.name }))}
                        placeholder={line.subcategory ? 'בחר פריט' : 'בחר תת-קטגוריה תחילה'}
                        disabled={!line.subcategory || filtered.length === 0}
                        clearable
                        ariaLabel={T.REPORT_FORM.TEMPLATE}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        {TT.QTY}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={line.qtyText}
                        onChange={(e) => updateLine(line.id, { qtyText: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={ammoLines.length <= 1}
                      className="p-2 rounded-md text-danger-600 hover:bg-danger-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={TT.REMOVE_AMMO_LINE}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{TT.NOTES}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              ביטול
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'שומר...' : TT.PLAN_SUBMIT}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
