/**
 * Client-side ammunition inventory reads.
 *
 * Lists `ammunitionInventory` (BRUCE / LOOSE_COUNT stock) and `ammunition`
 * (SERIAL items) via the Firebase client SDK. Mutations go through
 * `/api/ammunition-inventory`.
 */
import { db } from '@/lib/firebase';
import { collection, getDocs, onSnapshot, type Unsubscribe } from 'firebase/firestore';
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

/**
 * Subscribe to the BRUCE / LOOSE_COUNT stock collection. Listener-based —
 * persistent IndexedDB cache paints initial state synchronously and server
 * deltas keep it current without explicit refetch after each mutation.
 */
export function subscribeAmmunitionStock(
  onData: (rows: AmmunitionStock[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.AMMUNITION_INVENTORY),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionStock)),
    (err) => {
      console.error('Ammunition stock snapshot error:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribe to the per-serial ammunition items collection.
 */
export function subscribeSerialAmmunitionItems(
  onData: (rows: AmmunitionItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.AMMUNITION),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AmmunitionItem)),
    (err) => {
      console.error('Serial ammunition items snapshot error:', err);
      onError?.(err);
    }
  );
}
