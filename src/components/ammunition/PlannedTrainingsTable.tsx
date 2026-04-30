'use client';

import React, { useMemo, useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui';
import { FEATURES } from '@/constants/text';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { UserType } from '@/types/user';
import type {
  TrainingPlan,
  TrainingPlanStatus,
} from '@/types/training';

const TT = FEATURES.AMMUNITION.TRAINING;

const ACTIVE_STATUSES: TrainingPlanStatus[] = ['PENDING_APPROVAL', 'APPROVED'];

const STATUS_BADGE: Record<TrainingPlanStatus, string> = {
  PENDING_APPROVAL: 'bg-warning-100 text-warning-800',
  APPROVED: 'bg-success-100 text-success-800',
  REJECTED: 'bg-danger-100 text-danger-800',
  CANCELED: 'bg-neutral-200 text-neutral-700',
  COMPLETED: 'bg-info-100 text-info-800',
};

function tsToDate(ts: { toDate?: () => Date } | Date | null | undefined): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof (ts as { toDate?: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate();
  }
  return null;
}

function fmtRange(plan: TrainingPlan): string {
  const s = tsToDate(plan.startAt);
  const e = tsToDate(plan.endAt);
  if (!s || !e) return '—';
  const opts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };
  return `${s.toLocaleString('he-IL', opts)} – ${e.toLocaleString('he-IL', opts)}`;
}

export interface PlannedTrainingsTableProps {
  plans: TrainingPlan[];
  isLoading: boolean;
  onApprove: (planId: string) => Promise<boolean>;
  onReject: (planId: string, reason: string) => Promise<boolean>;
  onCancel: (planId: string) => Promise<boolean>;
  onComplete: (planId: string) => Promise<boolean>;
}

export default function PlannedTrainingsTable({
  plans,
  isLoading,
  onApprove,
  onReject,
  onCancel,
  onComplete,
}: PlannedTrainingsTableProps) {
  const { enhancedUser } = useAuth();
  const { config: systemConfig } = useSystemConfig();
  const ammoResponsibleUid = systemConfig?.ammoNotificationRecipientUserId ?? null;

  const isAdminOrSysMgr =
    enhancedUser?.userType === UserType.ADMIN ||
    enhancedUser?.userType === UserType.SYSTEM_MANAGER;
  const isAmmoResponsible =
    !!ammoResponsibleUid && enhancedUser?.uid === ammoResponsibleUid;
  const canApproveOrReject = isAdminOrSysMgr || isAmmoResponsible;

  const { active, archived } = useMemo(() => {
    const a: TrainingPlan[] = [];
    const z: TrainingPlan[] = [];
    for (const p of plans) {
      if (ACTIVE_STATUSES.includes(p.status)) a.push(p);
      else z.push(p);
    }
    return { active: a, archived: z };
  }, [plans]);

  if (isLoading) {
    return <div className="text-sm text-neutral-500 text-center py-8">{TT.LOADING}</div>;
  }

  return (
    <div className="space-y-4">
      <PlanTable
        title={TT.ACTIVE_PLANS}
        plans={active}
        emptyMsg={TT.NO_ACTIVE_PLANS}
        canApproveOrReject={canApproveOrReject}
        currentUid={enhancedUser?.uid}
        onApprove={onApprove}
        onReject={onReject}
        onCancel={onCancel}
        onComplete={onComplete}
      />

      <Disclosure as="div" className="border border-neutral-200 rounded-lg">
        {({ open }) => (
          <>
            <DisclosureButton className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <span>
                {TT.ARCHIVE} ({archived.length})
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </DisclosureButton>
            <DisclosurePanel className="border-t border-neutral-200">
              <PlanTable
                title=""
                plans={archived}
                emptyMsg={TT.NO_ARCHIVED_PLANS}
                canApproveOrReject={false}
                currentUid={enhancedUser?.uid}
                onApprove={onApprove}
                onReject={onReject}
                onCancel={onCancel}
                onComplete={onComplete}
              />
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </div>
  );
}

interface PlanTableProps {
  title: string;
  plans: TrainingPlan[];
  emptyMsg: string;
  canApproveOrReject: boolean;
  currentUid: string | undefined;
  onApprove: (planId: string) => Promise<boolean>;
  onReject: (planId: string, reason: string) => Promise<boolean>;
  onCancel: (planId: string) => Promise<boolean>;
  onComplete: (planId: string) => Promise<boolean>;
}

function PlanTable({
  title,
  plans,
  emptyMsg,
  canApproveOrReject,
  currentUid,
  onApprove,
  onReject,
  onCancel,
  onComplete,
}: PlanTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleAction = async (planId: string, fn: () => Promise<boolean>) => {
    setBusyId(planId);
    try {
      await fn();
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (planId: string) => {
    const reason = window.prompt(TT.REJECT_PROMPT, '');
    if (reason === null) return;
    if (!reason.trim()) {
      window.alert(TT.REJECT_REASON_REQUIRED);
      return;
    }
    await handleAction(planId, () => onReject(planId, reason.trim()));
  };

  const handleCancel = async (planId: string) => {
    if (!window.confirm(TT.CANCEL_CONFIRM)) return;
    await handleAction(planId, () => onCancel(planId));
  };

  return (
    <div>
      {title && (
        <h3 className="text-sm font-medium text-neutral-700 mb-2 px-1">{title}</h3>
      )}
      {plans.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-8">{emptyMsg}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.COL_DATE}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.COL_TEAM}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.COL_RANGE}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.COL_CONTACT}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.COL_AMMO}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.COL_STATUS}</th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-600">{TT.COL_ACTIONS}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {plans.map((p) => {
                const isPlanner = !!currentUid && currentUid === p.plannedBy;
                const canCancel =
                  (canApproveOrReject || isPlanner) &&
                  (p.status === 'PENDING_APPROVAL' || p.status === 'APPROVED');
                const canComplete =
                  (canApproveOrReject || isPlanner) && p.status === 'APPROVED';
                const showApproveReject =
                  canApproveOrReject && p.status === 'PENDING_APPROVAL';
                const busy = busyId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-3 py-2 text-xs text-neutral-700 whitespace-nowrap">
                      {fmtRange(p)}
                    </td>
                    <td className="px-3 py-2 text-neutral-900">{p.teamId}</td>
                    <td className="px-3 py-2 text-neutral-700">
                      <div>{p.rangeLocation}</div>
                      <div className="text-xs text-neutral-500">{TT.COL_FREQ}: {p.radioFrequency}</div>
                    </td>
                    <td className="px-3 py-2 text-neutral-700">
                      <div>{p.contactName}</div>
                      <div className="text-xs text-neutral-500">{p.contactPhone}</div>
                    </td>
                    <td className="px-3 py-2 text-neutral-700">
                      <ul className="text-xs space-y-0.5">
                        {p.ammoLines.map((l, idx) => (
                          <li key={idx}>
                            {l.templateName} × {l.qty}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[p.status]}`}
                      >
                        {TT.STATUS[p.status]}
                      </span>
                      {p.status === 'REJECTED' && p.rejectionReason && (
                        <div className="mt-1 text-xs text-danger-700">{p.rejectionReason}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {showApproveReject && (
                          <>
                            <Button
                              variant="primary"
                              onClick={() => handleAction(p.id, () => onApprove(p.id))}
                              disabled={busy}
                            >
                              {TT.APPROVE}
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleReject(p.id)}
                              disabled={busy}
                            >
                              {TT.REJECT}
                            </Button>
                          </>
                        )}
                        {canComplete && (
                          <Button
                            variant="secondary"
                            onClick={() => handleAction(p.id, () => onComplete(p.id))}
                            disabled={busy}
                          >
                            {TT.COMPLETE}
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            variant="ghost"
                            onClick={() => handleCancel(p.id)}
                            disabled={busy}
                          >
                            {TT.CANCEL}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
