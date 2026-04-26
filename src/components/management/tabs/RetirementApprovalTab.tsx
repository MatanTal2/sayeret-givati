'use client';

import React, { useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { RefreshCw } from 'lucide-react';
import { TEXT_CONSTANTS } from '@/constants/text';
import {
  type RetirementRequestDoc,
  RetirementRequestStatus,
} from '@/types/equipment';
import {
  getAllPendingRetirementRequests,
  getRecentDecidedRetirementRequests,
} from '@/lib/retirementRequestService';

export default function RetirementApprovalTab() {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.RETIRE_APPROVAL;
  const [pending, setPending] = useState<RetirementRequestDoc[]>([]);
  const [recent, setRecent] = useState<RetirementRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [pendingList, decided] = await Promise.all([
        getAllPendingRetirementRequests(),
        getRecentDecidedRetirementRequests(10),
      ]);
      setPending(pendingList);
      setRecent(decided);
    } catch (e) {
      console.error('Error loading retirement requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold text-neutral-900">{labels.TITLE}</h3>
        <p className="text-sm text-neutral-600">{labels.SUBTITLE}</p>
      </header>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <h4 className="text-sm font-medium text-neutral-900">{labels.TITLE}</h4>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {labels.REFRESH}
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-neutral-500">...</div>
        ) : pending.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">{labels.EMPTY}</div>
        ) : (
          <RequestTable rows={pending} statusOverride={labels.STATUS_PENDING} />
        )}
      </div>

      <section>
        <h4 className="text-sm font-medium text-neutral-700 mb-2">{labels.AUDIT_TITLE}</h4>
        {recent.length === 0 ? (
          <p className="text-xs text-neutral-500">{labels.AUDIT_EMPTY}</p>
        ) : (
          <RequestTable rows={recent} />
        )}
      </section>
    </div>
  );
}

function RequestTable({
  rows,
  statusOverride,
}: {
  rows: RetirementRequestDoc[];
  statusOverride?: string;
}) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.RETIRE_APPROVAL;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <Th>{labels.TABLE.EQUIPMENT}</Th>
            <Th>{labels.TABLE.SIGNER}</Th>
            <Th>{labels.TABLE.HOLDER}</Th>
            <Th>{labels.TABLE.REASON}</Th>
            <Th>{labels.TABLE.DATE}</Th>
            <Th>{labels.TABLE.STATUS}</Th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-neutral-50">
              <Td>
                <div className="font-medium text-neutral-900">{r.equipmentName}</div>
                <div className="text-xs text-neutral-500">#{r.equipmentId}</div>
              </Td>
              <Td>{r.signerUserName}</Td>
              <Td>{r.holderUserName}</Td>
              <Td className="max-w-[200px] truncate">{r.reason}</Td>
              <Td className="text-neutral-500">{formatDate(r.createdAt)}</Td>
              <Td>
                <StatusBadge status={r.status} fallback={statusOverride} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-start text-xs font-medium text-neutral-600 uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2 text-sm text-neutral-900 ${className ?? ''}`}>{children}</td>;
}

function StatusBadge({ status, fallback }: { status: RetirementRequestStatus; fallback?: string }) {
  const labels = TEXT_CONSTANTS.FEATURES.EQUIPMENT.RETIRE_APPROVAL;
  const map: Record<RetirementRequestStatus, { label: string; cls: string }> = {
    [RetirementRequestStatus.PENDING]: { label: fallback ?? labels.STATUS_PENDING, cls: 'bg-warning-100 text-warning-800' },
    [RetirementRequestStatus.APPROVED]: { label: labels.STATUS_APPROVED, cls: 'bg-success-100 text-success-800' },
    [RetirementRequestStatus.REJECTED]: { label: labels.STATUS_REJECTED, cls: 'bg-danger-100 text-danger-800' },
    [RetirementRequestStatus.CANCELLED]: { label: labels.STATUS_CANCELLED, cls: 'bg-neutral-100 text-neutral-700' },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function formatDate(t: Timestamp | Date | string | undefined): string {
  if (!t) return '—';
  const ms = t instanceof Timestamp ? t.toDate().getTime() : new Date(t as string).getTime();
  return new Date(ms).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
