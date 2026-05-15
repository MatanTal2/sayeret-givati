/**
 * Client-side ammunition templates service.
 *
 * Reads `ammunitionTemplates` via the Firebase client SDK. Writes go through
 * the server API (`/api/ammunition-templates`).
 */
import { db } from '@/lib/firebase';
import { collection, getDocs, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/db/collections';
import type { AmmunitionType } from '@/types/ammunition';

export async function listAmmunitionTemplates(): Promise<AmmunitionType[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.AMMUNITION_TEMPLATES));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionType);
}

export function subscribeAmmunitionTemplates(
  onData: (rows: AmmunitionType[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.AMMUNITION_TEMPLATES),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionType)),
    (err) => {
      console.error('Ammunition templates snapshot error:', err);
      onError?.(err);
    }
  );
}
