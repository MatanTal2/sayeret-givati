'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Send } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { Button } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { useAmmunitionTemplates } from '@/hooks/useAmmunitionTemplates';
import { useAmmunitionInventory } from '@/hooks/useAmmunitionInventory';
import { useAmmunitionReports } from '@/hooks/useAmmunitionReports';
import { useAmmunitionReportRequests } from '@/hooks/useAmmunitionReportRequests';
import AmmunitionInventoryView from '@/components/ammunition/AmmunitionInventoryView';
import AddInventoryModal from '@/components/ammunition/AddInventoryModal';
import ReportUsageForm from '@/components/ammunition/ReportUsageForm';
import { UserType } from '@/types/user';
import type { HolderType } from '@/types/ammunition';

const T = FEATURES.AMMUNITION;

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
    refresh: refreshInventory,
  } = useAmmunitionInventory();
  const { submit: submitReport } = useAmmunitionReports();
  const { requests } = useAmmunitionReportRequests();
  const searchParams = useSearchParams();
  const requestIdParam = searchParams.get('requestId');
  const [showAdd, setShowAdd] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

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

  const isManagerOrTL =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER ||
    enhancedUser?.userType === UserType.MANAGER ||
    enhancedUser?.userType === UserType.TEAM_LEADER;

  const filterSelf = useMemo(
    () =>
      enhancedUser
        ? { holderType: 'USER' as HolderType, holderId: enhancedUser.uid }
        : undefined,
    [enhancedUser]
  );
  const filterTeam = useMemo(
    () =>
      enhancedUser?.teamId
        ? { holderType: 'TEAM' as HolderType, holderId: enhancedUser.teamId }
        : undefined,
    [enhancedUser]
  );

  const canMutate = (entry: { templateId: string; holderType: HolderType; holderId: string }) => {
    if (!enhancedUser) return false;
    if (isManagerOrTL) {
      if (enhancedUser.userType === UserType.TEAM_LEADER) {
        if (entry.holderType === 'TEAM') return entry.holderId === enhancedUser.teamId;
        return true;
      }
      return true;
    }
    return entry.holderType === 'USER' && entry.holderId === enhancedUser.uid;
  };

  if (!enhancedUser) return null;

  const isLoading = templatesLoading || inventoryLoading;

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
      </div>

      {isLoading ? (
        <div className="text-sm text-neutral-500 text-center py-12">טוען...</div>
      ) : (
        <>
          <section>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">
              {T.SECTION_PERSONAL}
            </h3>
            <AmmunitionInventoryView
              templates={templates}
              stock={stock}
              items={items}
              filter={filterSelf}
              canMutate={canMutate}
              onDeleteStock={(id) => deleteStock(id)}
              onDeleteItem={(serial) => deleteSerialItem(serial)}
            />
          </section>

          {filterTeam && (
            <section>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">
                {T.SECTION_TEAM}
              </h3>
              <AmmunitionInventoryView
                templates={templates}
                stock={stock}
                items={items}
                filter={filterTeam}
                showHolder={false}
                canMutate={canMutate}
                onDeleteStock={(id) => deleteStock(id)}
                onDeleteItem={(serial) => deleteSerialItem(serial)}
              />
            </section>
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
    </div>
  );
}
