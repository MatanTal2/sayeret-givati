/**
 * Client-side ammunition reports reads.
 */
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/db/collections';
import type { AmmunitionReport } from '@/types/ammunition';

export interface ListReportsFilter {
  fromMs?: number;
  toMs?: number;
  teamId?: string;
  reporterId?: string;
  templateId?: string;
}

function buildReportsQuery(filter: ListReportsFilter) {
  const constraints = [];
  if (filter.teamId) constraints.push(where('teamId', '==', filter.teamId));
  if (filter.reporterId) constraints.push(where('reporterId', '==', filter.reporterId));
  if (filter.templateId) constraints.push(where('templateId', '==', filter.templateId));
  if (filter.fromMs !== undefined) {
    constraints.push(where('usedAt', '>=', Timestamp.fromDate(new Date(filter.fromMs))));
  }
  if (filter.toMs !== undefined) {
    constraints.push(where('usedAt', '<=', Timestamp.fromDate(new Date(filter.toMs))));
  }
  return query(
    collection(db, COLLECTIONS.AMMUNITION_REPORTS),
    ...constraints,
    orderBy('usedAt', 'desc')
  );
}

export async function listAmmunitionReports(
  filter: ListReportsFilter = {}
): Promise<AmmunitionReport[]> {
  const snap = await getDocs(buildReportsQuery(filter));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionReport);
}

export function subscribeAmmunitionReports(
  filter: ListReportsFilter,
  onData: (rows: AmmunitionReport[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    buildReportsQuery(filter),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionReport)),
    (err) => {
      console.error('Ammunition reports snapshot error:', err);
      onError?.(err);
    }
  );
}
