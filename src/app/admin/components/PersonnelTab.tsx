'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';
import { UserType } from '@/types/user';
import type { AuthorizedPersonnel } from '@/types/admin';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { TEXT_CONSTANTS } from '@/constants/text';
import { USER_TYPE_OPTIONS } from '@/constants/admin';
import { matchesPersonnelSearch } from '@/lib/personnelValidation';
import PersonnelFiltersBar, {
  DEFAULT_FILTERS,
  type PersonnelFilters,
} from './personnel/PersonnelFiltersBar';
import PersonnelRow, { type PersonnelEditChanges } from './personnel/PersonnelRow';

const USER_TYPE_LABEL_MAP = new Map<string, string>(
  USER_TYPE_OPTIONS.map((opt) => [opt.value, opt.label]),
);

function userTypeLabel(value: string): string {
  return USER_TYPE_LABEL_MAP.get(value) ?? value;
}

/**
 * Merged personnel tab. Replaces the old `ViewPersonnel` + `UpdatePersonnel`
 * pair: list view with inline-expand row edit. Owns expansion + edit-mode
 * state; defers data fetching + mutations to `usePersonnelManagement`.
 */
export default function PersonnelTab() {
  const labels = TEXT_CONSTANTS.FEATURES.ADMIN.PERSONNEL;
  const {
    personnel,
    isLoading,
    message,
    fetchPersonnel,
    updatePersonnel,
    deletePersonnel,
  } = usePersonnelManagement();

  const [filters, setFilters] = useState<PersonnelFilters>(DEFAULT_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuthorizedPersonnel | null>(null);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const filtered = useMemo(() => {
    const list = personnel.filter((p) => {
      if (!matchesPersonnelSearch(p, filters.searchTerm)) return false;
      if (filters.rank && p.rank !== filters.rank) return false;
      const pType = p.userType ?? UserType.USER;
      if (filters.userType && pType !== filters.userType) return false;
      if (filters.registration === 'registered' && !p.registered) return false;
      if (filters.registration === 'pending' && p.registered) return false;
      return true;
    });

    list.sort((a, b) => {
      switch (filters.sort) {
        case 'name_asc':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'he');
        case 'name_desc':
          return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`, 'he');
        case 'rank_asc':
          return a.rank.localeCompare(b.rank, 'he');
        case 'rank_desc':
          return b.rank.localeCompare(a.rank, 'he');
        case 'created_asc':
          return toMs(a.createdAt) - toMs(b.createdAt);
        case 'created_desc':
        default:
          return toMs(b.createdAt) - toMs(a.createdAt);
      }
    });

    return list;
  }, [personnel, filters]);

  const rankOptions = useMemo(
    () => Array.from(new Set(personnel.map((p) => p.rank).filter(Boolean))).sort(),
    [personnel],
  );

  const userTypeOptions = useMemo(() => {
    const set = new Set<string>();
    personnel.forEach((p) => set.add(p.userType ?? UserType.USER));
    return Array.from(set)
      .sort()
      .map((v) => ({ value: v, label: userTypeLabel(v) }));
  }, [personnel]);

  const handleToggleExpand = (id: string) => {
    if (editingId === id) return; // never collapse the row being edited
    setExpandedId((cur) => (cur === id ? null : id));
  };

  const handleStartEdit = (id: string) => {
    setExpandedId(id);
    setEditingId(id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async (id: string, changes: PersonnelEditChanges) => {
    if (Object.keys(changes).length === 0) {
      setEditingId(null);
      return;
    }
    setSavingId(id);
    try {
      const result = await updatePersonnel(id, changes);
      if (result.success) {
        setEditingId(null);
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = (person: AuthorizedPersonnel) => {
    setDeleteTarget(person);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    await deletePersonnel(deleteTarget.id);
    if (expandedId === deleteTarget.id) setExpandedId(null);
    if (editingId === deleteTarget.id) setEditingId(null);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-neutral-700">
        <span className="badge-base bg-info-100 text-info-800">
          {labels.TOTAL}: {personnel.length}
        </span>
        <span className="badge-base bg-success-100 text-success-800">
          {labels.FILTERED}: {filtered.length}
        </span>
      </div>

      <PersonnelFiltersBar
        filters={filters}
        onChange={setFilters}
        rankOptions={rankOptions}
        userTypeOptions={userTypeOptions}
      />

      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-success-50 border border-success-200 text-success-700'
              : message.type === 'error'
                ? 'bg-danger-50 border border-danger-200 text-danger-700'
                : 'bg-info-50 border border-info-200 text-info-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {isLoading && personnel.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-neutral-600 text-sm">
          {labels.LOADING}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-neutral-600 text-sm">
          {personnel.length === 0 ? labels.EMPTY_NO_PERSONNEL : labels.EMPTY_NO_RESULTS}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <PersonnelRow
              key={p.id ?? `${p.militaryPersonalNumberHash}`}
              person={p}
              expanded={expandedId === p.id}
              editing={editingId === p.id}
              isSaving={savingId === p.id}
              onToggleExpand={() => { if (p.id) handleToggleExpand(p.id); }}
              onCollapse={() => setExpandedId(null)}
              onStartEdit={() => { if (p.id) handleStartEdit(p.id); }}
              onCancelEdit={handleCancelEdit}
              onDelete={() => handleDelete(p)}
              onSave={async (changes) => {
                if (p.id) await handleSave(p.id, changes);
              }}
            />
          ))}
        </ul>
      )}

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title={labels.DELETE_CONFIRM_TITLE}
        message={labels.DELETE_CONFIRM_MESSAGE.replace(
          '{name}',
          deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : '',
        )}
        confirmText={labels.DELETE_CONFIRM_BTN}
        cancelText={labels.DELETE_CONFIRM_CANCEL}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isLoading}
        variant="danger"
        additionalInfo={labels.DELETE_CONFIRM_WARNING}
      />
    </div>
  );
}

function toMs(t: unknown): number {
  const v = (t as { toDate?: () => Date })?.toDate?.();
  if (v instanceof Date) return v.getTime();
  if (t instanceof Date) return (t as Date).getTime();
  return 0;
}
