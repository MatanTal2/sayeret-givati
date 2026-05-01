/**
 * Client-side guard schedule reads (Firestore client SDK).
 * Writes go through the API routes — see `useGuardSchedule` hook.
 *
 * Visibility is enforced by Firestore rules + the API route ownership check;
 * this read path also filters defensively by `createdBy` to avoid showing a
 * doc fetched out-of-order.
 */
import { collection, doc, getDoc, getDocs, orderBy, query, where, limit as fbLimit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from './collections';
import type { GuardSchedule } from '@/types/guardSchedule';

export async function listMyGuardSchedules(uid: string, max = 50): Promise<GuardSchedule[]> {
  if (!uid) return [];
  const q = query(
    collection(db, COLLECTIONS.GUARD_SCHEDULES),
    where('createdBy', '==', uid),
    orderBy('createdAt', 'desc'),
    fbLimit(max),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as GuardSchedule)
    .filter((s) => !s.deletedAt && s.createdBy === uid);
}

export async function getGuardSchedule(id: string): Promise<GuardSchedule | null> {
  if (!id) return null;
  const ref = doc(db, COLLECTIONS.GUARD_SCHEDULES, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as GuardSchedule;
  return data.deletedAt ? null : data;
}
