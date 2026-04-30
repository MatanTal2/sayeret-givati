'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Send, Target } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { Button } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { useAmmunitionTemplates } from '@/hooks/useAmmunitionTemplates';
import { useAmmunitionInventory } from '@/hooks/useAmmunitionInventory';
import { useAmmunitionReports } from '@/hooks/useAmmunitionReports';
import { useAmmunitionReportRequests } from '@/hooks/useAmmunitionReportRequests';
import { useUsers } from '@/hooks/useUsers';
import AmmunitionInventoryView, {
  type InventoryFilter,
  type AmmunitionViewMode,
} from '@/components/ammunition/AmmunitionInventoryView';
import AmmunitionReportsList from '@/components/ammunition/AmmunitionReportsList';
import AddInventoryModal from '@/components/ammunition/AddInventoryModal';
import ReportUsageForm from '@/components/ammunition/ReportUsageForm';
import TransferAmmoItemModal from '@/components/ammunition/TransferAmmoItemModal';
import { UserType } from '@/types/user';
import type { AmmunitionItem, HolderType } from '@/types/ammunition';

const T = FEATURES.AMMUNITION;

type Scope = 'personal' | 'team' | 'all';

export default function AmmunitionPage() {
  return (
    <AuthGuard>
      <AppShell title={`🎯 ${T.TITLE}`} subtitle={T.DESCRIPTION}>
        <AmmunitionPageContent />
      </AppShell>
    </AuthGuard>
  );
}

function AmmunitionPageContent() {
  const { enhancedUser } = useAuth();
  const { templates, isLoading: templatesLoading } = useAmmunitionTemplates();
  const {
    stock,
    items,
    isLoading: inventoryLoading,
    error,
    upsertStock,
    deleteStock,
    createSerialItem,
    deleteSerialItem,
    updateSerialItem,
    returnSerialItemToMgr,
    refresh: refreshInventory,
  } = useAmmunitionInventory();
  const { reports, submit: submitReport } = useAmmunitionReports();
  const { requests } = useAmmunitionReportRequests();
  const { users } = useUsers();
  const searchParams = useSearchParams();
  const requestIdParam = searchParams.get('requestId');
  const [showAdd, setShowAdd] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState<AmmunitionItem | null>(null);
  const [scope, setScope] = useState<Scope>('personal');
  const [viewMode, setViewMode] = useState<AmmunitionViewMode>('active');

  useEffect(() => {
    if (requestIdParam) {
      setActiveRequestId(requestIdParam);
      setShowReport(true);
    }
  }, [requestIdParam]);

  const activeRequest = useMemo(
    () => (activeRequestId ? requests.find((r) => r.id === activeRequestId) : null),
    [requests, activeRequestId]
  );

  const isAdminOrSysMgrOrMgr =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER;

  const isManagerOrTL =
    isAdminOrSysMgrOrMgr || enhancedUser?.userType === UserType.TEAM_LEADER;

  const isAdminOrSysMgr =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER;

  const filterPersonal = useMemo<InventoryFilter | undefined>(
    () => (enhancedUser ? { holderType: 'USER', holderId: enhancedUser.uid } : undefined),
    [enhancedUser]
  );
  const filterTeam = useMemo<InventoryFilter | undefined>(
    () => (enhancedUser?.teamId ? { holderType: 'TEAM', holderId: enhancedUser.teamId } : undefined),
    [enhancedUser]
  );

  const filterByScope = useMemo<InventoryFilter | undefined>(() => {
    if (scope === 'personal') return filterPersonal;
    if (scope === 'team') return filterTeam;
    return undefined;
  }, [scope, filterPersonal, filterTeam]);

  const showHolder = scope !== 'personal';

  const userNameByUid = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of users) {
      const name = u.fullName?.trim() || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
      if (name) m.set(u.uid, name);
    }
    return m;
  }, [users]);

  const resolveHolderName = (holderType: HolderType, holderId: string): string => {
    if (holderType === 'TEAM') return `${T.HOLDER_TEAM_PREFIX} ${holderId}`;
    return userNameByUid.get(holderId) || T.HOLDER_USER_UNKNOWN;
  };

  const canMutate = (entry: { templateId: string; holderType: HolderType; holderId: string }) => {
    if (!enhancedUser) return false;
    if (isAdminOrSysMgrOrMgr) return true;
    if (enhancedUser.userType === UserType.TEAM_LEADER) {
      if (entry.holderType === 'TEAM') return entry.holderId === enhancedUser.teamId;
      // For USER-held entries, fall back to self/team. The server resolves the holder's team.
      return entry.holderId === enhancedUser.uid;
    }
    return entry.holderType === 'USER' && entry.holderId === enhancedUser.uid;
  };

  const canDeleteRow = (entry: { templateId: string; holderType: HolderType; holderId: string }) => {
    void entry;
    return isAdminOrSysMgr;
  };

  if (!enhancedUser) return null;

  const isLoading = templatesLoading || inventoryLoading;

  const tabs: { id: Scope; label: string; visible: boolean }[] = [
    { id: 'personal', label: T.SCOPE_PERSONAL, visible: true },
    { id: 'team', label: T.SCOPE_TEAM, visible: !!filterTeam },
    { id: 'all', label: T.SCOPE_ALL, visible: isAdminOrSysMgrOrMgr },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => setShowAdd(true)} disabled={templates.length === 0}>
          <Plus className="w-4 h-4 ms-1" /> {T.ADD_NEW}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowReport(true)}
          disabled={
            templates.length === 0 ||
            (stock.filter((s) => s.holderType === 'USER' && s.holderId === enhancedUser.uid).length === 0 &&
              items.filter((i) => i.currentHolderType === 'USER' && i.currentHolderId === enhancedUser.uid).length === 0)
          }
        >
          <Send className="w-4 h-4 ms-1" /> {T.REPORT_USE}
        </Button>
        <Link
          href="/ammunition/training"
          className="ms-auto inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          <Target className="w-4 h-4" />
          אימונים
        </Link>
      </div>

      <div className="flex items-center gap-1 border-b border-neutral-200">
        {tabs.filter((t) => t.visible).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setScope(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              scope === tab.id
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50 self-start">
        {(['active', 'used'] as AmmunitionViewMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setViewMode(m)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === m
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {m === 'active' ? T.VIEW_ACTIVE : T.VIEW_HISTORY}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-500 text-center py-12">טוען...</div>
      ) : (
        <>
          <AmmunitionInventoryView
            templates={templates}
            stock={stock}
            items={items}
            filter={filterByScope}
            showHolder={showHolder}
            viewMode={viewMode}
            resolveHolderName={resolveHolderName}
            canMutate={canMutate}
            canDeleteRow={canDeleteRow}
            onDeleteStock={(id) => deleteStock(id)}
            onDeleteItem={(serial) => deleteSerialItem(serial)}
            onTransferItem={(item) => setTransferTarget(item)}
            onReturnItemToMgr={(item) => returnSerialItemToMgr(item.id)}
          />
          {viewMode === 'used' && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-neutral-700">{T.HISTORY_REPORTS_TITLE}</h3>
              <AmmunitionReportsList
                reports={reports.filter((r) => {
                  if (scope === 'personal') return r.reporterId === enhancedUser.uid;
                  if (scope === 'team') return r.teamId === enhancedUser.teamId;
                  return true;
                })}
                templates={templates}
                resolveReporterName={(uid, fallback) => userNameByUid.get(uid) || fallback}
              />
            </div>
          )}
        </>
      )}

      {showAdd && (
        <AddInventoryModal
          templates={templates}
          allowHolderPicker={isManagerOrTL}
          onClose={() => setShowAdd(false)}
          onSubmitStock={async (payload) => upsertStock(payload)}
          onSubmitItem={async (payload) => createSerialItem(payload)}
        />
      )}

      {showReport && (
        <ReportUsageForm
          templates={templates}
          myStock={stock.filter(
            (s) => s.holderType === 'USER' && s.holderId === enhancedUser.uid
          )}
          myItems={items.filter(
            (i) => i.currentHolderType === 'USER' && i.currentHolderId === enhancedUser.uid
          )}
          reportRequestId={activeRequest?.id}
          restrictTemplateIds={activeRequest?.templateIds}
          onClose={() => {
            setShowReport(false);
            setActiveRequestId(null);
          }}
          onSubmit={async (payload) => {
            const result = await submitReport(payload);
            if (result.ok) await refreshInventory();
            return result;
          }}
        />
      )}

      {transferTarget && (
        <TransferAmmoItemModal
          item={transferTarget}
          onClose={() => setTransferTarget(null)}
          onSubmit={async (serial, payload) => updateSerialItem(serial, payload)}
        />
      )}
    </div>
  );
}
