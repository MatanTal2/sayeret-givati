/**
 * Retirement Request Service — client-side facade.
 * Reads use client SDK; writes go through /api/retirement-requests/* routes.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/db/collections';
import {
  RetirementRequestDoc,
  RetirementRequestStatus,
} from '@/types/equipment';

export async function approveRetirementRequest(
  requestId: string,
  approverUserId: string,
  approverUserName: string,
  note?: string
): Promise<void> {
  const response = await fetch('/api/retirement-requests/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      approverUserId,
      approverUserName,
      ...(note ? { note } : {}),
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to approve retirement request');
  }
}

export async function rejectRetirementRequest(
  requestId: string,
  rejectorUserId: string,
  rejectorUserName: string,
  reason?: string
): Promise<void> {
  const response = await fetch('/api/retirement-requests/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      rejectorUserId,
      rejectorUserName,
      ...(reason ? { reason } : {}),
    }),
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to reject retirement request');
  }
}

export async function getPendingRetirementRequestsForHolder(
  holderUserId: string
): Promise<RetirementRequestDoc[]> {
  const q = query(
    collection(db, COLLECTIONS.RETIREMENT_REQUESTS),
    where('holderUserId', '==', holderUserId),
    where('status', '==', RetirementRequestStatus.PENDING),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RetirementRequestDoc));
}

export async function getRetirementRequestsBySigner(
  signerUserId: string
): Promise<RetirementRequestDoc[]> {
  const q = query(
    collection(db, COLLECTIONS.RETIREMENT_REQUESTS),
    where('signerUserId', '==', signerUserId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RetirementRequestDoc));
}

export async function getAllPendingRetirementRequests(): Promise<RetirementRequestDoc[]> {
  const q = query(
    collection(db, COLLECTIONS.RETIREMENT_REQUESTS),
    where('status', '==', RetirementRequestStatus.PENDING),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RetirementRequestDoc));
}

/**
 * Audit-trail query for the manager oversight panel: most recently
 * approved/rejected/cancelled requests. Two queries (Firestore can't `!=` PENDING
 * efficiently combined with orderBy). Merge + sort client-side.
 */
export async function getRecentDecidedRetirementRequests(
  limitCount: number = 10
): Promise<RetirementRequestDoc[]> {
  const decidedStatuses = [
    RetirementRequestStatus.APPROVED,
    RetirementRequestStatus.REJECTED,
    RetirementRequestStatus.CANCELLED,
  ] as const;
  const results = await Promise.all(
    decidedStatuses.map(async (status) => {
      const q = query(
        collection(db, COLLECTIONS.RETIREMENT_REQUESTS),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RetirementRequestDoc));
    })
  );
  return results
    .flat()
    .sort((a, b) => {
      const aMs = a.createdAt && 'toDate' in a.createdAt ? a.createdAt.toDate().getTime() : 0;
      const bMs = b.createdAt && 'toDate' in b.createdAt ? b.createdAt.toDate().getTime() : 0;
      return bMs - aMs;
    })
    .slice(0, limitCount);
}
