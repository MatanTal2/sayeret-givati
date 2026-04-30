/**
 * Client-side reads for the trainingPlans collection.
 * Mutations go through /api/training-plans (firebase-admin).
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
import type { TrainingPlan, TrainingPlanStatus } from '@/types/training';

export interface ListTrainingPlansFilter {
  teamId?: string;
  status?: TrainingPlanStatus;
  fromMs?: number;
  toMs?: number;
}

export async function listTrainingPlans(
  filter: ListTrainingPlansFilter = {}
): Promise<TrainingPlan[]> {
  const constraints = [];
  if (filter.teamId) constraints.push(where('teamId', '==', filter.teamId));
  if (filter.status) constraints.push(where('status', '==', filter.status));
  if (filter.fromMs !== undefined) {
    constraints.push(where('startAt', '>=', Timestamp.fromDate(new Date(filter.fromMs))));
  }
  if (filter.toMs !== undefined) {
    constraints.push(where('startAt', '<=', Timestamp.fromDate(new Date(filter.toMs))));
  }
  const q = query(
    collection(db, COLLECTIONS.TRAINING_PLANS),
    ...constraints,
    orderBy('startAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrainingPlan);
}
