/**
 * Report Request Service — client facade.
 * Reads via client SDK; writes via /api/report-requests routes.
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { apiFetch } from '@/lib/apiFetch';
import { COLLECTIONS } from '@/lib/db/collections';
import {
  ReportRequestDoc,
  ReportRequestScope,
  ReportRequestStatus,
} from '@/types/equipment';

interface CreateReportRequestArgs {
  scope: ReportRequestScope;
  targetUserIds: string[];
  targetEquipmentDocIds?: string[];
  targetTeamId?: string;
  requestedByUserName: string;
  note?: string;
}

export async function createReportRequest(
  args: CreateReportRequestArgs
): Promise<string> {
  const response = await apiFetch('/api/report-requests', {
    method: 'POST',
    body: JSON.stringify(args),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to create report request');
  return result.id;
}

export async function fulfillReportRequest(requestId: string): Promise<void> {
  const response = await apiFetch('/api/report-requests/fulfill', {
    method: 'POST',
    body: JSON.stringify({ requestId }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to fulfill report request');
}

export async function getPendingReportRequestsForUser(
  userId: string
): Promise<ReportRequestDoc[]> {
  const q = query(
    collection(db, COLLECTIONS.REPORT_REQUESTS),
    where('targetUserIds', 'array-contains', userId),
    where('status', 'in', [
      ReportRequestStatus.PENDING,
      ReportRequestStatus.PARTIALLY_FULFILLED,
    ]),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  // Filter out already-fulfilled-for-this-user + expired, in memory.
  const now = Date.now();
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as ReportRequestDoc))
    .filter((r) => {
      if (r.expiresAt && r.expiresAt.toDate().getTime() < now) return false;
      const f = r.fulfillmentByUser?.[userId];
      return !f?.fulfilled;
    });
}

export async function getReportRequestsByRequester(
  requesterUserId: string
): Promise<ReportRequestDoc[]> {
  const q = query(
    collection(db, COLLECTIONS.REPORT_REQUESTS),
    where('requestedByUserId', '==', requesterUserId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ReportRequestDoc));
}
