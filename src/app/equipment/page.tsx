'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { useEquipment } from '@/hooks/useEquipment';
import EquipmentErrorBoundary from '@/components/equipment/EquipmentErrorBoundary';
import EquipmentLoadingState from '@/components/equipment/EquipmentLoadingState';
import EquipmentTabs from '@/components/equipment/EquipmentTabs';
import EquipmentTable from '@/components/equipment/EquipmentTable';
import EquipmentToolbar from '@/components/equipment/EquipmentToolbar';
import BulkActionBar, { type BulkAction } from '@/components/equipment/BulkActionBar';
import type { EquipmentRowAction } from '@/components/equipment/EquipmentRowActions';
import AddEquipmentWizard from '@/components/equipment/AddEquipmentWizard';
import ReportModal from '@/components/equipment/ReportModal';
import ReturnModal from '@/components/equipment/ReturnModal';
import TransferModal from '@/components/equipment/TransferModal';
import ExchangeRequestModal from '@/components/equipment/ExchangeRequestModal';
import ApproveExchangeModal from '@/components/equipment/ApproveExchangeModal';
import RejectExchangeModal from '@/components/equipment/RejectExchangeModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import ActionHistoryPanel from '@/components/equipment/ActionHistoryPanel';
import { type Equipment, EquipmentStatus, EquipmentCondition } from '@/types/equipment';
import PersonalAmmunitionSection from '@/components/equipment/PersonalAmmunitionSection';
import TeamAmmunitionSection from '@/components/equipment/TeamAmmunitionSection';
import { Select } from '@/components/ui';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { useCategoryLookup } from '@/hooks/useCategoryLookup';
import {
  requestExchange,
  approveExchangeRequest,
  rejectExchangeRequest,
  replaceByAnother,
  sendToStorage,
  pullFromStorage,
  findPendingExchangeRequest,
} from '@/lib/equipmentExchangeClient';

type ActiveModal =
  | { kind: 'wizard' }
  | { kind: 'report'; equipment: Equipment }
  | { kind: 'return'; equipment: Equipment }
  | { kind: 'transfer'; equipment: Equipment }
  | { kind: 'history'; equipment: Equipment }
  | { kind: 'request-exchange'; equipment: Equipment }
  | { kind: 'approve-exchange'; equipment: Equipment; requestId: string }
  | { kind: 'reject-exchange'; equipment: Equipment; requestId: string }
  | { kind: 'replace-by-another'; equipment: Equipment }
  | { kind: 'send-to-storage'; equipment: Equipment }
  | { kind: 'pull-from-storage'; equipment: Equipment }
  | null;

export default function EquipmentPage() {
  return (
    <AuthGuard>
      <EquipmentErrorBoundary>
        <AppShell
          title={`🎖️ ${TEXT_CONSTANTS.FEATURES.EQUIPMENT.TITLE}`}
          subtitle={TEXT_CONSTANTS.FEATURES.EQUIPMENT.DESCRIPTION}
        >
          <EquipmentPageContent />
        </AppShell>
      </EquipmentErrorBoundary>
    </AuthGuard>
  );
}

function EquipmentPageContent() {
  const { enhancedUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeTemplate = searchParams.get('resumeTemplate');
  const resumeDraft = searchParams.get('resumeDraft');

  const {
    equipment,
    archivedEquipment,
    loading,
    error,
    scope,
    setScope,
    refreshEquipment,
    reportEquipment,
    retireEquipment,
  } = useEquipment({ scope: 'self' });

  const [view, setView] = useState<'active' | 'archive'>('active');
  const visibleEquipment = view === 'archive' ? archivedEquipment : equipment;

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [submitting, setSubmitting] = useState(false);
  const { config: systemConfig } = useSystemConfig();
  const roundOpen = !!systemConfig?.roundOpen;
  const { categoryName } = useCategoryLookup();

  // Auto-open wizard when notification deep-links here (once per mount).
  // Ref guard prevents reopen after close: router.replace is async, so the
  // resumeTemplate param can still be in searchParams during the re-render
  // that follows setActiveModal(null) — without the ref, the effect would
  // re-fire and reopen the modal.
  const consumedDeepLink = useRef(false);
  useEffect(() => {
    if ((resumeTemplate || resumeDraft) && !activeModal && !consumedDeepLink.current) {
      consumedDeepLink.current = true;
      setActiveModal({ kind: 'wizard' });
    }
  }, [resumeTemplate, resumeDraft, activeModal]);

  const categoryOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const it of visibleEquipment) {
      const c = (it.category ?? '').trim();
      if (c) ids.add(c);
    }
    return Array.from(ids)
      .map((id) => ({ value: id, label: categoryName(id) ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label, 'he'));
  }, [visibleEquipment, categoryName]);

  const filtered = useMemo(() => {
    return visibleEquipment.filter((it) => {
      if (statusFilter !== 'all' && it.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const resolvedCategory = (categoryName(it.category) ?? it.category).toLowerCase();
        const hit =
          it.id.toLowerCase().includes(q) ||
          it.productName.toLowerCase().includes(q) ||
          it.currentHolder.toLowerCase().includes(q) ||
          resolvedCategory.includes(q) ||
          (it.location ?? '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [visibleEquipment, statusFilter, categoryFilter, searchTerm, categoryName]);

  const closeModal = () => {
    setActiveModal(null);
    if (resumeTemplate || resumeDraft) {
      router.replace('/equipment');
    }
  };

  const handleRowAction = async (item: Equipment, action: EquipmentRowAction) => {
    switch (action) {
      case 'report':   setActiveModal({ kind: 'report', equipment: item }); break;
      case 'transfer': setActiveModal({ kind: 'transfer', equipment: item }); break;
      case 'return':   setActiveModal({ kind: 'return', equipment: item }); break;
      case 'history':  setActiveModal({ kind: 'history', equipment: item }); break;
      case 'request-exchange':
        setActiveModal({ kind: 'request-exchange', equipment: item });
        break;
      case 'replace-by-another':
        setActiveModal({ kind: 'replace-by-another', equipment: item });
        break;
      case 'send-to-storage':
        setActiveModal({ kind: 'send-to-storage', equipment: item });
        break;
      case 'pull-from-storage':
        setActiveModal({ kind: 'pull-from-storage', equipment: item });
        break;
      case 'approve-exchange':
      case 'reject-exchange': {
        const res = await findPendingExchangeRequest(item.id);
        if (!res.success || !res.requestId) {
          alert(res.success ? 'לא נמצאה בקשת החלפה ממתינה' : res.error);
          return;
        }
        setActiveModal({
          kind: action === 'approve-exchange' ? 'approve-exchange' : 'reject-exchange',
          equipment: item,
          requestId: res.requestId,
        });
        break;
      }
    }
  };

  const handleBulk = async (action: BulkAction) => {
    if (selectedIds.size === 0 || !enhancedUser) return;
    if (action === 'report') {
      // Only an aggregate "report now" pass without photos — privileged users only.
      // For non-privileged we'd need to walk each item with a camera; that's a future enhancement.
      for (const id of selectedIds) {
        await reportEquipment(id, null, EquipmentCondition.GOOD, 'Bulk report');
      }
      setSelectedIds(new Set());
    } else if (action === 'transfer') {
      // Bulk transfer requires a single target — beyond current TransferModal. Left for ForceOps in /management.
      alert('בחר פריטים בודדים והעבר אותם דרך תפריט הפעולות.');
    } else if (action === 'retire') {
      const reason = prompt(TEXT_CONSTANTS.FEATURES.EQUIPMENT.RETURN_MODAL.REASON_PLACEHOLDER);
      if (!reason) return;
      for (const id of selectedIds) {
        await retireEquipment(id, reason);
      }
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const visibleIds = filtered.map((i) => i.id);
      const allSelected = visibleIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  if (!enhancedUser) return <EquipmentLoadingState count={3} />;

  return (
    <div className="max-w-7xl mx-auto w-full pb-24">
      <EquipmentTabs scope={scope} onChange={setScope} user={enhancedUser} />

      <EquipmentToolbar
        view={view}
        onViewChange={(v) => {
          setView(v);
          // Selection set is bucket-scoped — clear it when switching views so
          // a bulk action can't accidentally target rows the user can't see.
          setSelectedIds(new Set());
        }}
        archiveCount={archivedEquipment.length}
        onAddClick={() => setActiveModal({ kind: 'wizard' })}
        canAdd
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categoryOptions={categoryOptions}
        view={view}
      />

      {loading && visibleEquipment.length === 0 ? (
        <EquipmentLoadingState count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={refreshEquipment} />
      ) : (
        <EquipmentTable
          equipment={filtered}
          user={enhancedUser}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAllVisible={toggleSelectAllVisible}
          onRowAction={handleRowAction}
          emptyMessage={emptyMessageFor(scope, view)}
          roundOpen={roundOpen}
        />
      )}

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onAction={handleBulk}
        allowRetire={false}
      />

      {scope === 'self' && <PersonalAmmunitionSection user={enhancedUser} />}
      {scope === 'team' && <TeamAmmunitionSection user={enhancedUser} />}

      {activeModal?.kind === 'wizard' && (
        <AddEquipmentWizard
          user={enhancedUser}
          resumeDraftId={resumeDraft}
          resumeTemplateId={resumeTemplate}
          onClose={closeModal}
          onSubmitted={() => { refreshEquipment(); closeModal(); }}
        />
      )}
      {activeModal?.kind === 'report' && (
        <ReportModal
          equipment={activeModal.equipment}
          user={enhancedUser}
          onClose={closeModal}
          onSubmit={async (photoUrl, note, condition) => {
            const ok = await reportEquipment(activeModal.equipment.id, photoUrl, condition, note);
            return { success: ok, error: ok ? undefined : TEXT_CONSTANTS.FEATURES.EQUIPMENT.REPORT_MODAL.ERROR };
          }}
        />
      )}
      {activeModal?.kind === 'return' && (
        <ReturnModal
          equipment={activeModal.equipment}
          isHolder={activeModal.equipment.currentHolderId === enhancedUser.uid}
          onClose={closeModal}
          onSubmit={async (reason) => retireEquipment(activeModal.equipment.id, reason)}
        />
      )}
      {activeModal?.kind === 'transfer' && (
        <TransferModal
          isOpen
          equipment={activeModal.equipment}
          onClose={closeModal}
          onTransferSuccess={() => { refreshEquipment(); closeModal(); }}
        />
      )}
      {activeModal?.kind === 'history' && (
        <ActionHistoryPanel equipment={activeModal.equipment} onClose={closeModal} />
      )}
      {activeModal?.kind === 'request-exchange' && (
        <ExchangeRequestModal
          equipment={activeModal.equipment}
          onClose={closeModal}
          onSubmit={async (reason) => {
            const res = await requestExchange(activeModal.equipment.id, reason);
            if (res.success) { refreshEquipment(); }
            return { success: res.success, error: res.success ? undefined : res.error };
          }}
        />
      )}
      {activeModal?.kind === 'approve-exchange' && (
        <ApproveExchangeModal
          equipment={activeModal.equipment}
          onClose={closeModal}
          onSubmit={async (newSerial, note) => {
            const res = await approveExchangeRequest(activeModal.requestId, newSerial, note);
            if (res.success) { refreshEquipment(); }
            return { success: res.success, error: res.success ? undefined : res.error };
          }}
        />
      )}
      {activeModal?.kind === 'reject-exchange' && (
        <RejectExchangeModal
          equipment={activeModal.equipment}
          onClose={closeModal}
          onSubmit={async (reason) => {
            const res = await rejectExchangeRequest(activeModal.requestId, reason);
            if (res.success) { refreshEquipment(); }
            return { success: res.success, error: res.success ? undefined : res.error };
          }}
        />
      )}
      {activeModal?.kind === 'replace-by-another' && (
        <ApproveExchangeModal
          equipment={activeModal.equipment}
          isReplaceByAnother
          onClose={closeModal}
          onSubmit={async (newSerial, note) => {
            const res = await replaceByAnother(activeModal.equipment.id, newSerial, note);
            if (res.success) { refreshEquipment(); }
            return { success: res.success, error: res.success ? undefined : res.error };
          }}
        />
      )}
      {activeModal?.kind === 'send-to-storage' && (
        <ConfirmationModal
          isOpen
          variant="info"
          title={TEXT_CONSTANTS.FEATURES.EQUIPMENT.STORAGE.SEND_TITLE}
          message={TEXT_CONSTANTS.FEATURES.EQUIPMENT.STORAGE.SEND_DESCRIPTION}
          confirmText={TEXT_CONSTANTS.FEATURES.EQUIPMENT.STORAGE.SEND_SUBMIT}
          cancelText={TEXT_CONSTANTS.FEATURES.EQUIPMENT.EXCHANGE.CANCEL}
          isLoading={submitting}
          onCancel={() => !submitting && closeModal()}
          onConfirm={async () => {
            setSubmitting(true);
            const res = await sendToStorage(activeModal.equipment.id);
            setSubmitting(false);
            if (res.success) {
              refreshEquipment();
              closeModal();
            } else {
              alert(res.error);
            }
          }}
        />
      )}
      {activeModal?.kind === 'pull-from-storage' && (
        <ConfirmationModal
          isOpen
          variant="info"
          title={TEXT_CONSTANTS.FEATURES.EQUIPMENT.STORAGE.PULL_TITLE}
          message={TEXT_CONSTANTS.FEATURES.EQUIPMENT.STORAGE.PULL_DESCRIPTION}
          confirmText={TEXT_CONSTANTS.FEATURES.EQUIPMENT.STORAGE.PULL_SUBMIT}
          cancelText={TEXT_CONSTANTS.FEATURES.EQUIPMENT.EXCHANGE.CANCEL}
          isLoading={submitting}
          onCancel={() => !submitting && closeModal()}
          onConfirm={async () => {
            setSubmitting(true);
            const res = await pullFromStorage(activeModal.equipment.id);
            setSubmitting(false);
            if (res.success) {
              refreshEquipment();
              closeModal();
            } else {
              alert(res.error);
            }
          }}
        />
      )}
    </div>
  );
}

function FilterBar({
  searchTerm,
  onSearch,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  categoryOptions,
  view,
}: {
  searchTerm: string;
  onSearch: (s: string) => void;
  statusFilter: EquipmentStatus | 'all';
  onStatusChange: (s: EquipmentStatus | 'all') => void;
  categoryFilter: string | 'all';
  onCategoryChange: (c: string | 'all') => void;
  categoryOptions: { value: string; label: string }[];
  view: 'active' | 'archive';
}) {
  // Status filter only makes sense on the active list — the archive is, by
  // definition, all RETIRED. Hiding the filter avoids producing a confusing
  // empty result if a user selects e.g. AVAILABLE while viewing the archive.
  const showStatusFilter = view === 'active';
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-3 mb-4 space-y-2">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.SEARCH_PLACEHOLDER}
          className="w-full ps-9 pe-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className={showStatusFilter ? 'grid grid-cols-2 gap-2' : ''}>
        {showStatusFilter && (
          <Select
            value={statusFilter === 'all' ? null : statusFilter}
            onChange={(v) => onStatusChange(v === null ? 'all' : (v as EquipmentStatus))}
            options={[
              { value: EquipmentStatus.AVAILABLE, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.AVAILABLE },
              { value: EquipmentStatus.SECURITY, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.SECURITY },
              { value: EquipmentStatus.REPAIR, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.REPAIR },
              { value: EquipmentStatus.LOST, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.LOST },
              { value: EquipmentStatus.PENDING_TRANSFER, label: TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.PENDING_TRANSFER },
            ]}
            placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.ALL_STATUSES}
            clearable
            ariaLabel={TEXT_CONSTANTS.FEATURES.EQUIPMENT.ALL_STATUSES}
          />
        )}
        <Select
          value={categoryFilter === 'all' ? null : categoryFilter}
          onChange={(v) => onCategoryChange(v === null ? 'all' : (v as string))}
          options={categoryOptions}
          placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.ALL_CATEGORIES}
          clearable
          ariaLabel={TEXT_CONSTANTS.FEATURES.EQUIPMENT.ALL_CATEGORIES}
        />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-danger-200 p-8 text-center">
      <p className="text-sm text-danger-700 mb-3">❌ {message}</p>
      <button onClick={onRetry} className="btn-secondary">
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.TRY_AGAIN}
      </button>
    </div>
  );
}

function emptyMessageFor(scope: 'self' | 'team' | 'all', view: 'active' | 'archive'): string {
  const t = TEXT_CONSTANTS.FEATURES.EQUIPMENT;
  if (view === 'archive') {
    if (scope === 'self') return t.ARCHIVE.EMPTY_SELF;
    if (scope === 'team') return t.ARCHIVE.EMPTY_TEAM;
    return t.ARCHIVE.EMPTY_ALL;
  }
  if (scope === 'self') return t.EMPTY_TAB_SELF;
  if (scope === 'team') return t.EMPTY_TAB_TEAM;
  return t.EMPTY_TAB_ALL;
}
