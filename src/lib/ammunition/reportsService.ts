/**
 * Client-side ammunition reports reads.
 */
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
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

export async function listAmmunitionReports(
  filter: ListReportsFilter = {}
): Promise<AmmunitionReport[]> {
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
  const q = query(collection(db, COLLECTIONS.AMMUNITION_REPORTS), ...constraints, orderBy('usedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionReport);
}
