'use client';

import React, { useMemo, useState } from 'react';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { FEATURES, TEXT_CONSTANTS } from '@/constants/text';
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
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [rejectingPlanId, setRejectingPlanId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const handleAction = async (planId: string, fn: () => Promise<boolean>) => {
    setBusyId(planId);
    try {
      await fn();
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = (planId: string) => {
    setRejectingPlanId(planId);
    setRejectReason('');
    setRejectError(null);
  };

  const closeRejectDialog = () => {
    if (busyId === rejectingPlanId) return;
    setRejectingPlanId(null);
    setRejectReason('');
    setRejectError(null);
  };

  const submitReject = async () => {
    if (!rejectingPlanId) return;
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectError(TT.REJECT_REASON_REQUIRED);
      return;
    }
    const planId = rejectingPlanId;
    setRejectingPlanId(null);
    setRejectReason('');
    setRejectError(null);
    await handleAction(planId, () => onReject(planId, trimmed));
  };

  const handleCancel = (planId: string) => {
    setPendingCancelId(planId);
  };

  const confirmCancel = async () => {
    if (!pendingCancelId) return;
    const planId = pendingCancelId;
    setPendingCancelId(null);
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
          <table className="min-w-full text-start text-sm">
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
      <ConfirmationModal
        isOpen={!!pendingCancelId}
        title={TT.CANCEL}
        message={TT.CANCEL_CONFIRM}
        confirmText={TT.CANCEL}
        cancelText={TEXT_CONSTANTS.BUTTONS.CLOSE}
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancelId(null)}
        variant="warning"
        useHomePageStyle
      />

      <Dialog
        open={!!rejectingPlanId}
        onClose={closeRejectDialog}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200">
              <DialogTitle className="text-lg font-semibold text-neutral-900">
                {TT.REJECT_TITLE}
              </DialogTitle>
            </div>
            <div className="p-6 space-y-3">
              <label htmlFor="reject-reason" className="block text-sm font-medium text-neutral-700">
                {TT.REJECT_PROMPT}
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError(null);
                }}
                rows={4}
                disabled={busyId === rejectingPlanId}
                placeholder={TT.REJECT_REASON_PLACEHOLDER}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              {rejectError && (
                <p className="text-sm text-danger-700" role="alert">
                  {rejectError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-neutral-200">
              <Button
                variant="secondary"
                onClick={closeRejectDialog}
                disabled={busyId === rejectingPlanId}
              >
                {TT.REJECT_CANCEL}
              </Button>
              <Button
                variant="danger"
                onClick={submitReject}
                disabled={busyId === rejectingPlanId}
              >
                {TT.REJECT_SUBMIT}
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
