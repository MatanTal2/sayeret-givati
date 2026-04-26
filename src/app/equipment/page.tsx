'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { TEXT_CONSTANTS } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { useEquipment } from '@/hooks/useEquipment';
import EquipmentErrorBoundary from '@/components/equipment/EquipmentErrorBoundary';
import EquipmentLoadingState from '@/components/equipment/EquipmentLoadingState';
import EquipmentTabs from '@/components/equipment/EquipmentTabs';
import EquipmentTable from '@/components/equipment/EquipmentTable';
import BulkActionBar, { type BulkAction } from '@/components/equipment/BulkActionBar';
import type { EquipmentRowAction } from '@/components/equipment/EquipmentRowActions';
import AddEquipmentWizard from '@/components/equipment/AddEquipmentWizard';
import ReportModal from '@/components/equipment/ReportModal';
import ReturnModal from '@/components/equipment/ReturnModal';
import TransferModal from '@/components/equipment/TransferModal';
import ActionHistoryPanel from '@/components/equipment/ActionHistoryPanel';
import { type Equipment, EquipmentStatus } from '@/types/equipment';
import PersonalAmmunitionSection from '@/components/equipment/PersonalAmmunitionSection';

type ActiveModal =
  | { kind: 'wizard' }
  | { kind: 'report'; equipment: Equipment }
  | { kind: 'return'; equipment: Equipment }
  | { kind: 'transfer'; equipment: Equipment }
  | { kind: 'history'; equipment: Equipment }
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
    loading,
    error,
    scope,
    setScope,
    refreshEquipment,
    reportEquipment,
    retireEquipment,
  } = useEquipment({ scope: 'self' });

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');

  // Auto-open wizard when notification deep-links here
  useEffect(() => {
    if ((resumeTemplate || resumeDraft) && !activeModal) {
      setActiveModal({ kind: 'wizard' });
    }
  }, [resumeTemplate, resumeDraft, activeModal]);

  const filtered = useMemo(() => {
    return equipment.filter((it) => {
      if (statusFilter !== 'all' && it.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const hit =
          it.id.toLowerCase().includes(q) ||
          it.productName.toLowerCase().includes(q) ||
          it.currentHolder.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q) ||
          (it.location ?? '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [equipment, statusFilter, searchTerm]);

  const closeModal = () => {
    setActiveModal(null);
    if (resumeTemplate || resumeDraft) {
      router.replace('/equipment');
    }
  };

  const handleRowAction = (item: Equipment, action: EquipmentRowAction) => {
    switch (action) {
      case 'report':   setActiveModal({ kind: 'report', equipment: item }); break;
      case 'transfer': setActiveModal({ kind: 'transfer', equipment: item }); break;
      case 'return':   setActiveModal({ kind: 'return', equipment: item }); break;
      case 'history':  setActiveModal({ kind: 'history', equipment: item }); break;
    }
  };

  const handleBulk = async (action: BulkAction) => {
    if (selectedIds.size === 0 || !enhancedUser) return;
    if (action === 'report') {
      // Only an aggregate "report now" pass without photos — privileged users only.
      // For non-privileged we'd need to walk each item with a camera; that's a future enhancement.
      for (const id of selectedIds) {
        await reportEquipment(id, null, 'Bulk report');
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
      <PageHeader onAdd={() => setActiveModal({ kind: 'wizard' })} />

      <EquipmentTabs scope={scope} onChange={setScope} user={enhancedUser} />

      <FilterBar
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {loading && equipment.length === 0 ? (
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
          emptyMessage={emptyMessageFor(scope)}
        />
      )}

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onAction={handleBulk}
        allowRetire={false}
      />

      <PersonalAmmunitionSection user={enhancedUser} />

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
          onSubmit={async (photoUrl, note) => {
            const ok = await reportEquipment(activeModal.equipment.id, photoUrl, note);
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
    </div>
  );
}

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        {TEXT_CONSTANTS.FEATURES.EQUIPMENT.ADD_NEW}
      </button>
    </div>
  );
}

function FilterBar({
  searchTerm,
  onSearch,
  statusFilter,
  onStatusChange,
}: {
  searchTerm: string;
  onSearch: (s: string) => void;
  statusFilter: EquipmentStatus | 'all';
  onStatusChange: (s: EquipmentStatus | 'all') => void;
}) {
  return (
    <div className="bg-white rounded-b-xl border-x border-b border-neutral-200 p-3 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
      <div className="sm:col-span-2 relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={TEXT_CONSTANTS.FEATURES.EQUIPMENT.SEARCH_PLACEHOLDER}
          className="w-full ps-9 pe-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as EquipmentStatus | 'all')}
        className="px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 focus:ring-2 focus:ring-primary-500"
      >
        <option value="all">{TEXT_CONSTANTS.FEATURES.EQUIPMENT.ALL_STATUSES}</option>
        <option value={EquipmentStatus.AVAILABLE}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.AVAILABLE}</option>
        <option value={EquipmentStatus.SECURITY}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.SECURITY}</option>
        <option value={EquipmentStatus.REPAIR}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.REPAIR}</option>
        <option value={EquipmentStatus.LOST}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.LOST}</option>
        <option value={EquipmentStatus.PENDING_TRANSFER}>{TEXT_CONSTANTS.FEATURES.EQUIPMENT.STATUS_OPTIONS.PENDING_TRANSFER}</option>
      </select>
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

function emptyMessageFor(scope: 'self' | 'team' | 'all'): string {
  const t = TEXT_CONSTANTS.FEATURES.EQUIPMENT;
  if (scope === 'self') return t.EMPTY_TAB_SELF;
  if (scope === 'team') return t.EMPTY_TAB_TEAM;
  return t.EMPTY_TAB_ALL;
}
