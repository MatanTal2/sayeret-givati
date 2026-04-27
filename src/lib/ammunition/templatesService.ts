/**
 * Client-side ammunition templates service.
 *
 * Reads `ammunitionTemplates` via the Firebase client SDK. Writes go through
 * the server API (`/api/ammunition-templates`).
 */
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/db/collections';
import type { AmmunitionType } from '@/types/ammunition';

export async function listAmmunitionTemplates(): Promise<AmmunitionType[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.AMMUNITION_TEMPLATES));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionType);
}
