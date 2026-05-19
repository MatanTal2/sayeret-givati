'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AuthorizedPersonnel } from '@/types/admin';
import { UserType } from '@/types/user';
import { Select } from '@/components/ui';
import {
  RANK_OPTIONS,
  USER_TYPE_OPTIONS,
  FORM_CONSTRAINTS,
} from '@/constants/admin';
import { TEXT_CONSTANTS } from '@/constants/text';
import { formatPhoneForDisplay } from '@/utils/validationUtils';
import {
  isValidPersonnelName,
  isValidPersonnelPhone,
  isValidPersonnelRank,
} from '@/lib/personnelValidation';
import { cn } from '@/lib/cn';
import PersonnelRowActions, { type PersonnelRowAction } from './PersonnelRowActions';

interface PersonnelRowProps {
  person: AuthorizedPersonnel;
  expanded: boolean;
  editing: boolean;
  onToggleExpand: () => void;
  onCollapse: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onSave: (changes: PersonnelEditChanges) => Promise<void> | void;
  isSaving: boolean;
}

export interface PersonnelEditChanges {
  firstName?: string;
  lastName?: string;
  rank?: string;
  phoneNumber?: string;
  userType?: UserType;
}

const USER_TYPE_LABEL = new Map<string, string>(
  USER_TYPE_OPTIONS.map((opt) => [opt.value, opt.label]),
);

function userTypeLabel(t: UserType | undefined): string {
  const value = t ?? UserType.USER;
  return USER_TYPE_LABEL.get(value) ?? value;
}

function formatDate(timestamp: unknown): string {
  try {
    const date = (timestamp as { toDate?: () => Date })?.toDate?.() ?? new Date();
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * A single row in the Personnel tab.
 *
 * Collapsed (mobile-first, all viewports):
 *   - registration status dot + name (rank inline) + user-type badge + 3-dots.
 *
 * Expanded (view):
 *   - 2-col grid listing the rest of the fields.
 *
 * Expanded (edit):
 *   - same grid swapped for inputs; Save / Cancel row at the bottom + inline error.
 */
export default function PersonnelRow({
  person,
  expanded,
  editing,
  onToggleExpand,
  onCollapse,
  onStartEdit,
  onCancelEdit,
  onDelete,
  onSave,
  isSaving,
}: PersonnelRowProps) {
  const labels = TEXT_CONSTANTS.FEATURES.ADMIN.PERSONNEL;
  const draftInit = {
    firstName: person.firstName,
    lastName: person.lastName,
    rank: person.rank,
    phoneNumber: person.phoneNumber,
    userType: person.userType ?? UserType.USER,
  };
  const [draft, setDraft] = useState(draftInit);
  const [error, setError] = useState<string | null>(null);
  const lastEditingRef = useRef(false);

  // Reset draft each time we enter edit mode or the person changes.
  useEffect(() => {
    if (editing && !lastEditingRef.current) {
      setDraft({
        firstName: person.firstName,
        lastName: person.lastName,
        rank: person.rank,
        phoneNumber: person.phoneNumber,
        userType: person.userType ?? UserType.USER,
      });
      setError(null);
    }
    lastEditingRef.current = editing;
  }, [editing, person]);

  const handleAction = (action: PersonnelRowAction) => {
    if (action === 'edit') {
      onStartEdit();
    } else if (action === 'delete') {
      onDelete();
    }
  };

  const handleSave = async () => {
    // Validation
    if (!isValidPersonnelName(draft.firstName) || !isValidPersonnelName(draft.lastName)) {
      setError(labels.VALIDATION_NAME);
      return;
    }
    if (!isValidPersonnelRank(draft.rank)) {
      setError(labels.VALIDATION_RANK);
      return;
    }
    if (!isValidPersonnelPhone(draft.phoneNumber)) {
      setError(labels.VALIDATION_PHONE);
      return;
    }
    setError(null);

    const changes: PersonnelEditChanges = {};
    if (draft.firstName !== person.firstName) changes.firstName = draft.firstName.trim();
    if (draft.lastName !== person.lastName) changes.lastName = draft.lastName.trim();
    if (draft.rank !== person.rank) changes.rank = draft.rank;
    if (draft.phoneNumber !== person.phoneNumber) changes.phoneNumber = draft.phoneNumber.trim();
    if (draft.userType !== (person.userType ?? UserType.USER)) changes.userType = draft.userType;

    await onSave(changes);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editing) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelEdit();
      }
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleExpand();
    } else if (e.key === 'Escape' && expanded) {
      e.preventDefault();
      onCollapse();
    }
  };

  const fullName = `${person.firstName} ${person.lastName}`.trim();

  return (
    <li
      className={cn(
        'bg-white rounded-xl border border-neutral-200 overflow-hidden transition-shadow transition-colors duration-200',
        expanded
          ? 'ring-2 ring-primary-400 shadow-md border-primary-300'
          : 'hover:border-neutral-300',
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={expanded ? labels.COLLAPSE_ARIA : labels.EXPAND_ARIA}
        onClick={() => {
          if (!editing) onToggleExpand();
        }}
        onKeyDown={handleKeyDown}
        className="px-3 py-3 flex items-center gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-xl"
      >
        <span
          aria-label={labels.REGISTRATION_DOT_ARIA}
          title={person.registered ? labels.REGISTERED_BADGE : labels.PENDING_BADGE}
          className={cn(
            'w-2.5 h-2.5 rounded-full flex-shrink-0',
            person.registered ? 'bg-success-500' : 'bg-neutral-300',
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-neutral-900 truncate">
            {person.rank && (
              <span className="text-xs text-neutral-500 me-1">{person.rank}</span>
            )}
            <span>{fullName}</span>
          </div>
        </div>
        <span className="badge-base bg-info-100 text-info-800 flex-shrink-0">
          {userTypeLabel(person.userType)}
        </span>
        <div onClick={(e) => e.stopPropagation()}>
          <PersonnelRowActions onAction={handleAction} disabled={isSaving} />
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-neutral-100">
          {editing ? (
            <EditPanel
              draft={draft}
              onDraftChange={setDraft}
              error={error}
              isSaving={isSaving}
              onSave={handleSave}
              onCancel={onCancelEdit}
            />
          ) : (
            <ViewPanel person={person} />
          )}
        </div>
      )}
    </li>
  );
}

function ViewPanel({ person }: { person: AuthorizedPersonnel }) {
  const labels = TEXT_CONSTANTS.FEATURES.ADMIN.PERSONNEL;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <Field label={labels.FIELD_PHONE} value={formatPhoneForDisplay(person.phoneNumber)} />
      <Field label={labels.FIELD_RANK} value={person.rank} />
      <Field
        label={labels.FIELD_REGISTRATION}
        value={person.registered ? labels.REGISTERED_BADGE : labels.PENDING_BADGE}
      />
      <Field label={labels.FIELD_CREATED_AT} value={formatDate(person.createdAt)} />
    </div>
  );
}

interface EditPanelProps {
  draft: {
    firstName: string;
    lastName: string;
    rank: string;
    phoneNumber: string;
    userType: UserType;
  };
  onDraftChange: React.Dispatch<React.SetStateAction<EditPanelProps['draft']>>;
  error: string | null;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function EditPanel({
  draft,
  onDraftChange,
  error,
  isSaving,
  onSave,
  onCancel,
}: EditPanelProps) {
  const labels = TEXT_CONSTANTS.FEATURES.ADMIN.PERSONNEL;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <LabeledInput
          label={labels.FIELD_FIRST_NAME}
          value={draft.firstName}
          maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
          onChange={(v) => onDraftChange((d) => ({ ...d, firstName: v }))}
          disabled={isSaving}
        />
        <LabeledInput
          label={labels.FIELD_LAST_NAME}
          value={draft.lastName}
          maxLength={FORM_CONSTRAINTS.NAME_MAX_LENGTH}
          onChange={(v) => onDraftChange((d) => ({ ...d, lastName: v }))}
          disabled={isSaving}
        />
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            {labels.FIELD_RANK}
          </label>
          <Select
            value={draft.rank || null}
            onChange={(v) => onDraftChange((d) => ({ ...d, rank: v ?? '' }))}
            options={RANK_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
            placeholder={labels.FIELD_RANK}
            clearable
            disabled={isSaving}
            ariaLabel={labels.FIELD_RANK}
          />
        </div>
        <LabeledInput
          label={labels.FIELD_PHONE}
          value={draft.phoneNumber}
          type="tel"
          maxLength={FORM_CONSTRAINTS.PHONE_MAX_LENGTH}
          onChange={(v) => onDraftChange((d) => ({ ...d, phoneNumber: v }))}
          disabled={isSaving}
        />
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            {labels.FIELD_USER_TYPE}
          </label>
          <Select
            value={draft.userType}
            onChange={(v) => v && onDraftChange((d) => ({ ...d, userType: v as UserType }))}
            options={USER_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
            disabled={isSaving}
            ariaLabel={labels.FIELD_USER_TYPE}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="btn-primary !py-2 !px-4 text-sm"
        >
          {isSaving ? labels.SAVING : labels.SAVE}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="btn-ghost text-sm"
        >
          {labels.CANCEL}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="text-neutral-900">{value || '—'}</div>
    </div>
  );
}

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  maxLength?: number;
  type?: 'text' | 'tel';
}

function LabeledInput({
  label,
  value,
  onChange,
  disabled,
  maxLength,
  type = 'text',
}: LabeledInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        className="input-base text-sm"
      />
    </div>
  );
}
