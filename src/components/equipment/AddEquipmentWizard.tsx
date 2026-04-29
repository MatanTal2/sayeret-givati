'use client';

import React, { useEffect, useState } from 'react';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
import { X, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';
import {
  EquipmentStatus,
  type Equipment,
  type EquipmentType,
} from '@/types/equipment';
import type { EnhancedAuthUser } from '@/types/user';
import { uploadEquipmentPhoto } from '@/lib/storageService';
import { getDraft, deleteEquipmentDraft } from '@/lib/equipmentDraftService';
import { EquipmentService } from '@/lib/equipmentService';
import RequestNewTemplateFlow from './RequestNewTemplateFlow';
import WizardStepMode from './wizard/WizardStepMode';
import WizardStepTemplate from './wizard/WizardStepTemplate';
import WizardStepDetails from './wizard/WizardStepDetails';
import WizardStepReview from './wizard/WizardStepReview';
import {
  type WizardState,
  type WizardStep,
  type WizardItemDraft,
  createEmptyItem,
} from './wizard/types';

interface AddEquipmentWizardProps {
  user: EnhancedAuthUser;
  resumeDraftId?: string | null;
  resumeTemplateId?: string | null;
  onClose: () => void;
  onSubmitted: () => void;
}

const STEPS: WizardStep[] = ['mode', 'template', 'details', 'review'];

export default function AddEquipmentWizard({
  user,
  resumeDraftId,
  resumeTemplateId,
  onClose,
  onSubmitted,
}: AddEquipmentWizardProps) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.WIZARD;
  const [state, setState] = useState<WizardState>({
    step: 'mode',
    mode: 'single',
    categoryId: null,
    subcategoryId: null,
    template: null,
    items: [createEmptyItem()],
    showRequestFlow: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumedDraftId, setResumedDraftId] = useState<string | null>(null);
  const [resuming, setResuming] = useState<boolean>(!!(resumeDraftId || resumeTemplateId));

  useEffect(() => {
    if (!resumeDraftId && !resumeTemplateId) return;
    let cancelled = false;
    (async () => {
      try {
        // Resolve a draft. If only a template ID is given, resolve to the user's matching draft.
        let draftId = resumeDraftId ?? null;
        if (!draftId && resumeTemplateId) {
          const { getDraftsForUser } = await import('@/lib/equipmentDraftService');
          const drafts = await getDraftsForUser(user.uid);
          const match = drafts.find((d) => d.templateRequestId === resumeTemplateId);
          draftId = match?.id ?? null;
        }
        if (!draftId) { if (!cancelled) setResuming(false); return; }
        const draft = await getDraft(draftId);
        if (!draft) { if (!cancelled) setResuming(false); return; }
        const templateId = draft.templateRequestId ?? resumeTemplateId;
        if (!templateId) { if (!cancelled) setResuming(false); return; }
        const tplResult = await EquipmentService.Types.getEquipmentType(templateId);
        const template = (tplResult.data as EquipmentType | undefined) ?? null;
        if (!template) { if (!cancelled) setResuming(false); return; }
        if (cancelled) return;
        setResumedDraftId(draftId);
        setState((prev) => ({
          ...prev,
          template,
          categoryId: template.category,
          subcategoryId: template.subcategory || null,
          mode: 'single',
          step: 'details',
          items: [
            createEmptyItem({
              serialNumber: draft.serialNumber ?? '',
              catalogNumber: draft.catalogNumber ?? template.defaultCatalogNumber ?? '',
              photoUrl: draft.photoUrl ?? null,
              notes: draft.notes ?? '',
            }),
          ],
        }));
      } catch (e) {
        console.error('Failed to resume draft', e);
      } finally {
        if (!cancelled) setResuming(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resumeDraftId, resumeTemplateId, user.uid]);

  const stepIndex = STEPS.indexOf(state.step);
  const canGoNext = computeCanGoNext(state);

  const goNext = () => {
    if (!canGoNext) return;
    const next = STEPS[Math.min(stepIndex + 1, STEPS.length - 1)];
    setState((s) => ({ ...s, step: next }));
  };
  const goBack = () => {
    const prev = STEPS[Math.max(stepIndex - 1, 0)];
    setState((s) => ({ ...s, step: prev }));
  };

  const handleSubmit = async () => {
    if (!state.template) return;
    setError(null);
    setSubmitting(true);
    try {
      const seenSerials = new Set<string>();
      const items: Array<Omit<Equipment, 'createdAt' | 'updatedAt' | 'trackingHistory'>> = [];

      for (const draft of state.items) {
        if (state.template.requiresSerialNumber) {
          if (!draft.serialNumber) throw new Error(labels.SERIAL_REQUIRED);
          if (seenSerials.has(draft.serialNumber)) throw new Error(labels.SERIAL_DUPLICATE);
          seenSerials.add(draft.serialNumber);
        }
        let photoUrl = draft.photoUrl;
        if (!photoUrl && draft.photoBlob) {
          const id = state.template.requiresSerialNumber ? draft.serialNumber : `${state.template.id}-${Date.now()}-${draft.uid}`;
          const upload = await uploadEquipmentPhoto(draft.photoBlob, id, 'signup');
          photoUrl = upload.url;
        }
        if (!photoUrl) throw new Error(labels.PHOTO_REQUIRED_ERROR);

        const id = state.template.requiresSerialNumber ? draft.serialNumber : crypto.randomUUID();
        const signerName =
          user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.uid;
        const now = serverTimestamp() as Timestamp;
        items.push({
          id,
          equipmentType: state.template.id,
          productName: state.template.name,
          category: state.template.category,
          subcategory: state.template.subcategory,
          acquisitionDate: now,
          dateSigned: now,
          lastSeen: now,
          lastReportUpdate: now,
          signedBy: signerName,
          signedById: user.uid,
          currentHolder: signerName,
          currentHolderId: user.uid,
          holderTeamId: user.teamId,
          signerTeamId: user.teamId,
          status: EquipmentStatus.AVAILABLE,
          location: draft.location || '',
          condition: draft.condition,
          catalogNumber: draft.catalogNumber || undefined,
          photoUrl,
          notes: draft.notes || undefined,
          requiresDailyStatusCheck: state.template.requiresDailyStatusCheck,
        });
      }

      const signerName =
        user.displayName ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.uid;
      const result = await EquipmentService.Items.createEquipmentBatch(
        items,
        signerName,
        user.uid,
        signerName,
        user.uid,
      );
      if (!result.success) throw new Error(result.message);

      if (resumedDraftId) {
        try { await deleteEquipmentDraft(resumedDraftId); } catch { /* non-fatal */ }
      }
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between p-5 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {state.showRequestFlow ? labels.NOT_FOUND_TITLE : labels.TITLE}
            </h2>
            {resumedDraftId && !state.showRequestFlow && (
              <p className="text-xs text-info-700 mt-0.5">{labels.RESUMING_DRAFT_HINT}</p>
            )}
            {!state.showRequestFlow && <StepIndicator step={state.step} />}
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="close">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-5 flex-1">
          {resuming ? (
            <p className="text-sm text-neutral-500 text-center py-6">{TEXT_CONSTANTS.FEATURES.EQUIPMENT.LOADING_EQUIPMENT}</p>
          ) : state.showRequestFlow ? (
            <RequestNewTemplateFlow
              capturedSerialNumber={state.items[0]?.serialNumber || undefined}
              capturedCatalogNumber={state.items[0]?.catalogNumber || undefined}
              capturedNotes={state.items[0]?.notes || undefined}
              onCancel={() => setState((s) => ({ ...s, showRequestFlow: false }))}
              onSubmitted={() => onSubmitted()}
            />
          ) : (
            <StepBody
              state={state}
              setState={setState}
              error={error}
            />
          )}
        </div>

        {!state.showRequestFlow && !resuming && (
          <footer className="flex items-center justify-between gap-2 p-5 border-t border-neutral-200">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0 || submitting}
              className="btn-secondary inline-flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4" /> {labels.PREV}
            </button>
            {state.step !== 'review' ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext || submitting}
                className="btn-primary inline-flex items-center gap-1"
              >
                {labels.NEXT} <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary">
                {submitting ? labels.SUBMITTING : labels.SUBMIT}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: WizardStep }) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.WIZARD;
  const map: Record<WizardStep, string> = {
    mode: labels.STEP_MODE,
    template: labels.STEP_TEMPLATE,
    details: labels.STEP_DETAILS,
    review: labels.STEP_REVIEW,
  };
  return <p className="text-xs text-neutral-500 mt-0.5">{map[step]}</p>;
}

function StepBody({
  state,
  setState,
  error,
}: {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      {state.step === 'mode' && (
        <WizardStepMode
          mode={state.mode}
          onChange={(mode) =>
            setState((s) =>
              s.mode === mode ? s : { ...s, mode, items: [createEmptyItem()] }
            )
          }
        />
      )}
      {state.step === 'template' && (
        <WizardStepTemplate
          categoryId={state.categoryId}
          subcategoryId={state.subcategoryId}
          template={state.template}
          onSelectCategory={(categoryId) => setState((s) => ({ ...s, categoryId, template: null }))}
          onSelectSubcategory={(subcategoryId) => setState((s) => ({ ...s, subcategoryId, template: null }))}
          onPick={({ categoryId, subcategoryId, template }) =>
            setState((s) => ({
              ...s,
              categoryId,
              subcategoryId,
              template,
              items: padItems(s.items, s.mode, template.defaultCatalogNumber ?? ''),
            }))
          }
          onRequestNew={() => setState((s) => ({ ...s, showRequestFlow: true }))}
        />
      )}
      {state.step === 'details' && state.template && (
        <WizardStepDetails
          template={state.template}
          items={state.items}
          isBulk={state.mode === 'bulk'}
          onChange={(items) => setState((s) => ({ ...s, items }))}
        />
      )}
      {state.step === 'review' && state.template && (
        <WizardStepReview template={state.template} items={state.items} />
      )}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}
    </div>
  );
}

function padItems(items: WizardItemDraft[], mode: 'single' | 'bulk', defaultCatalog: string): WizardItemDraft[] {
  if (mode === 'single' && items.length > 1) return [items[0]];
  return items.map((it) => ({ ...it, catalogNumber: it.catalogNumber || defaultCatalog }));
}

function computeCanGoNext(state: WizardState): boolean {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.WIZARD;
  void labels;
  switch (state.step) {
    case 'mode': return true;
    case 'template': return !!state.template;
    case 'details': {
      if (!state.template) return false;
      for (const item of state.items) {
        if (state.template.requiresSerialNumber && !item.serialNumber) return false;
        if (!item.photoBlob && !item.photoUrl) return false;
      }
      return true;
    }
    case 'review': return true;
  }
}
