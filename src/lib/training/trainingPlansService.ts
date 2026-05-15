/**
 * Client-side reads for the trainingPlans collection.
 * Mutations go through /api/training-plans (firebase-admin).
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
import type { TrainingPlan, TrainingPlanStatus } from '@/types/training';

export interface ListTrainingPlansFilter {
  teamId?: string;
  status?: TrainingPlanStatus;
  fromMs?: number;
  toMs?: number;
}

function buildTrainingPlansQuery(filter: ListTrainingPlansFilter) {
  const constraints = [];
  if (filter.teamId) constraints.push(where('teamId', '==', filter.teamId));
  if (filter.status) constraints.push(where('status', '==', filter.status));
  if (filter.fromMs !== undefined) {
    constraints.push(where('startAt', '>=', Timestamp.fromDate(new Date(filter.fromMs))));
  }
  if (filter.toMs !== undefined) {
    constraints.push(where('startAt', '<=', Timestamp.fromDate(new Date(filter.toMs))));
  }
  return query(
    collection(db, COLLECTIONS.TRAINING_PLANS),
    ...constraints,
    orderBy('startAt', 'desc')
  );
}

export async function listTrainingPlans(
  filter: ListTrainingPlansFilter = {}
): Promise<TrainingPlan[]> {
  const snap = await getDocs(buildTrainingPlansQuery(filter));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrainingPlan);
}

export function subscribeTrainingPlans(
  filter: ListTrainingPlansFilter,
  onData: (plans: TrainingPlan[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    buildTrainingPlansQuery(filter),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrainingPlan)),
    (err) => {
      console.error('Training plans snapshot error:', err);
      onError?.(err);
    }
  );
}
