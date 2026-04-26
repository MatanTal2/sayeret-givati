/**
 * Client-side ammunition inventory reads.
 *
 * Lists `ammunitionInventory` (BRUCE / LOOSE_COUNT stock) and `ammunition`
 * (SERIAL items) via the Firebase client SDK. Mutations go through
 * `/api/ammunition-inventory`.
 */
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/db/collections';
import type { AmmunitionItem, AmmunitionStock } from '@/types/ammunition';

export async function listAmmunitionStock(): Promise<AmmunitionStock[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.AMMUNITION_INVENTORY));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionStock);
}

export async function listSerialAmmunitionItems(): Promise<AmmunitionItem[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.AMMUNITION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionItem);
}
